import type { APIRoute } from "astro";
import { getNickname } from "../../../server/cookies";
import { getRoomBySlug } from "../../../server/rooms";
import { listOnlineNicknames } from "../../../server/presence";

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const slug = params.slug!;
  const room = await getRoomBySlug(slug);
  if (!room) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

  const names = listOnlineNicknames(room.id);
  return new Response(JSON.stringify({ names }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
