import type { APIRoute } from "astro";
import { db } from "../../../db/client";
import { messages } from "../../../db/schema";
import { getClientId, getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { broadcast } from "../../../server/hub";
import { getAvatarColorForDisplay } from "../../../server/presence";
import { renderMessageLi } from "../../../server/render";
import { and, desc, eq, lt } from "drizzle-orm";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies, redirect }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return redirect("/nick");

  const slug = params.slug!;
  const room = await getRoomBySlug(slug);
  if (!room) return redirect("/rooms/lobby");

  const form = await request.formData();
  const body = String(form.get("body") ?? "").trim();
  if (!body) {
    return new Response(null, { status: 204 });
  }

  const inserted = await db
    .insert(messages)
    .values({
      roomId: room.id,
      nickname,
      kind: "user",
      body,
    })
    .returning();

  const msg = inserted[0]!;
  const prevRows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.roomId, room.id), lt(messages.id, msg.id)))
    .orderBy(desc(messages.id))
    .limit(1);
  const prev = prevRows[0];
  const continuation = !!(
    prev &&
    prev.kind === "user" &&
    prev.nickname.trim() === msg.nickname.trim()
  );

  const clientId = getClientId(cookies);
  const avatarBg = getAvatarColorForDisplay(room.id, msg.nickname, {
    viewerClientId: clientId ?? undefined,
    viewerNickname: nickname,
  });

  const html = renderMessageLi({
    nickname: msg.nickname,
    body: msg.body,
    createdAt: msg.createdAt,
    kind: "user",
    continuation,
    avatarBg,
  });
  broadcast(room.id, {
    type: "message",
    html,
    ...(clientId ? { excludeClientId: clientId } : {}),
  });

  // Plain HTML fragment appended to `#messages` (same as SSE); sender excluded from broadcast.
  return new Response(html, {
    status: 200,
    headers: {
      "HX-Trigger": "messageSent",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};

