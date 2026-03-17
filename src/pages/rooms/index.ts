import type { APIRoute } from "astro";
import { createRoom, getOrCreateLobby } from "../../server/rooms";
import { getNickname } from "../../server/cookies";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return redirect("/nick");

  await getOrCreateLobby();

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length < 2 || name.length > 32) {
    return redirect("/rooms/lobby");
  }

  const room = await createRoom(name);
  return redirect(`/rooms/${room.slug}`);
};

