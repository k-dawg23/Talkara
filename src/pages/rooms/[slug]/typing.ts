import type { APIRoute } from "astro";
import { getClientId, getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { broadcast } from "../../../server/hub";
import { typingPing, renderTypingOob } from "../../../server/typing";

export const prerender = false;

export const POST: APIRoute = async ({ params, cookies, redirect }) => {
  const nickname = getNickname(cookies);
  const clientId = getClientId(cookies);
  if (!nickname || !clientId) return redirect("/nick");

  const slug = params.slug!;
  const room = await getRoomBySlug(slug);
  if (!room) return redirect("/rooms/lobby");

  typingPing(room.id, clientId, nickname);
  broadcast(room.id, { type: "message", html: renderTypingOob(room.id) });

  return new Response(null, { status: 204 });
};

