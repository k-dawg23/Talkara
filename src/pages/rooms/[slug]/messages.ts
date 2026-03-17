import type { APIRoute } from "astro";
import { db } from "../../../db/client";
import { messages } from "../../../db/schema";
import { getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { broadcast } from "../../../server/hub";
import { renderMessageLi } from "../../../server/render";

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
  const html = renderMessageLi({ nickname: msg.nickname, body: msg.body, createdAt: msg.createdAt, kind: "user" });

  broadcast(room.id, { type: "message", html });

  const clear = `<script hx-swap-oob="true">try{const t=document.getElementById('composerInput'); if(t){t.value=''; t.dispatchEvent(new Event('input',{bubbles:true})); t.focus();}}catch(e){}</script>`;

  // Return the rendered message as an OOB swap so the sender sees it immediately
  // even if their SSE connection is delayed.
  return new Response(html + clear, {
    status: 200,
    headers: {
      "HX-Trigger": "messageSent",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};

