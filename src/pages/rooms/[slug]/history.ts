import type { APIRoute } from "astro";
import { db } from "../../../db/client";
import { messages } from "../../../db/schema";
import { getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { and, eq, lt, desc, ne } from "drizzle-orm";
import { renderMessageLi } from "../../../server/render";

export const prerender = false;

function sentinel(opts: { roomSlug: string; beforeIso: string | null; text: string }) {
  if (!opts.beforeIso) {
    return `<li id="historySentinel" class="py-2 text-center text-xs text-tc-300">${opts.text}</li>`;
  }
  const href = `/rooms/${opts.roomSlug}/history?before=${encodeURIComponent(opts.beforeIso)}&limit=50`;
  return `<li id="historySentinel" class="py-2 text-center text-xs text-tc-300" hx-get="${href}" hx-trigger="revealed" hx-swap="outerHTML">${opts.text}</li>`;
}

export const GET: APIRoute = async ({ params, url, cookies, redirect }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return redirect("/nick");

  const slug = params.slug!;
  const room = await getRoomBySlug(slug);
  if (!room) return redirect("/rooms/lobby");

  const before = url.searchParams.get("before");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50") || 50, 100);

  if (!before) {
    return new Response("", { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const beforeDate = new Date(before);
  if (Number.isNaN(beforeDate.getTime())) {
    return new Response("", { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.roomId, room.id), lt(messages.createdAt, beforeDate), ne(messages.kind, "system")))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  const html = rows
    .reverse()
    .map((m) => renderMessageLi({ nickname: m.nickname, body: m.body, createdAt: m.createdAt, kind: m.kind }))
    .join("");

  if (rows.length === 0) {
    return new Response(sentinel({ roomSlug: room.slug, beforeIso: null, text: "No more messages" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const oldestReturned = rows[rows.length - 1]!.createdAt.toISOString();
  const out = sentinel({ roomSlug: room.slug, beforeIso: oldestReturned, text: "Load older messages…" }) + html;

  return new Response(out, { headers: { "Content-Type": "text/html; charset=utf-8" } });
};

