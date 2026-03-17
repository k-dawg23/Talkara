import type { APIRoute } from "astro";
import { db } from "../../../db/client";
import { messages } from "../../../db/schema";
import { subscribe } from "../../../server/hub";
import { getClientId, getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { broadcast } from "../../../server/hub";
import { renderMessageLi } from "../../../server/render";
import { presenceJoin, presenceLeave, renderPresenceOob } from "../../../server/presence";

export const prerender = false;

function sseEvent(event: string, data: string) {
  const lines = data.split("\n").map((l) => `data: ${l}`).join("\n");
  return `event: ${event}\n${lines}\n\n`;
}

export const GET: APIRoute = async ({ params, cookies, redirect, request }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return redirect("/nick");

  const clientId = getClientId(cookies);
  if (!clientId) return redirect("/nick");

  const slug = params.slug!;
  const room = await getRoomBySlug(slug);
  if (!room) return redirect("/rooms/lobby");

  const signal = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const unsubscribe = subscribe(room.id, (evt) => {
        controller.enqueue(encoder.encode(sseEvent(evt.type, evt.html)));
      });

      controller.enqueue(encoder.encode(`event: ready\ndata: ok\n\n`));

      // Join: update presence + broadcast presence + system message
      presenceJoin(room.id, clientId, nickname);
      broadcast(room.id, { type: "message", html: renderPresenceOob(room.id) });

      const joinBody = `${nickname} joined`;
      const joinInserted = await db
        .insert(messages)
        .values({ roomId: room.id, nickname, kind: "system", body: joinBody })
        .returning();
      broadcast(
        room.id,
        { type: "message", html: renderMessageLi({ nickname: joinInserted[0]!.nickname, body: joinInserted[0]!.body, createdAt: joinInserted[0]!.createdAt, kind: "system" }) },
      );

      // Keepalive ping to prevent proxies closing connection
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
      }, 15000);

      const cleanup = async () => {
        clearInterval(interval);
        unsubscribe();
        presenceLeave(room.id, clientId);
        broadcast(room.id, { type: "message", html: renderPresenceOob(room.id) });

        const leaveBody = `${nickname} left`;
        const leaveInserted = await db
          .insert(messages)
          .values({ roomId: room.id, nickname, kind: "system", body: leaveBody })
          .returning();
        broadcast(
          room.id,
          { type: "message", html: renderMessageLi({ nickname: leaveInserted[0]!.nickname, body: leaveInserted[0]!.body, createdAt: leaveInserted[0]!.createdAt, kind: "system" }) },
        );
        controller.close();
      };

      if (signal) signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};

