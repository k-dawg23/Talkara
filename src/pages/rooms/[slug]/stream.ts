import type { APIRoute } from "astro";
import { db } from "../../../db/client";
import { messages } from "../../../db/schema";
import { subscribe } from "../../../server/hub";
import { getClientId, getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { broadcast } from "../../../server/hub";
import { renderMessageLi } from "../../../server/render";
import { presenceJoin, presenceLeave, presenceTouch, renderPresenceOob } from "../../../server/presence";

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
      let closed = false;

      const safeEnqueue = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // connection likely closed
        }
      };

      const unsubscribe = subscribe(room.id, (evt) => {
        if (evt.type === "message" && evt.excludeClientId != null && evt.excludeClientId === clientId) {
          return;
        }
        safeEnqueue(sseEvent(evt.type, evt.html));
      });

      safeEnqueue(`event: ready\ndata: ok\n\n`);

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

      // Keepalive ping + refresh presence last-seen so cleanupStale() does not drop live SSE clients (~30s TTL).
      const interval = setInterval(() => {
        presenceTouch(room.id, clientId);
        safeEnqueue(`event: ping\ndata: ${Date.now()}\n\n`);
      }, 15000);

      const cleanup = async () => {
        if (closed) return;
        closed = true;
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
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      if (signal) signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      // best-effort cleanup happens via abort handler above
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Hint reverse proxies (nginx-style + some CDNs) not to buffer the stream
      "X-Accel-Buffering": "no",
    },
  });
};

