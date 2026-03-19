import type { APIRoute } from "astro";
import { getNickname } from "../../../server/cookies";
import { deleteRoomBySlug, getRoomBySlug } from "../../../server/rooms";
import { broadcastAll } from "../../../server/hub";

export const prerender = false;

export const POST: APIRoute = async ({ params, cookies, redirect }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return redirect("/nick");

  const slug = params.slug!;
  const room = await getRoomBySlug(slug);
  if (!room) return redirect("/rooms/lobby");

  const deleted = await deleteRoomBySlug(slug);
  if (!deleted) {
    // Could not delete (e.g., trying to delete Lobby)
    return redirect(`/rooms/${slug}`);
  }

  // Broadcast room list update to all connected clients
  broadcastAll({ type: "roomsUpdated", html: "1" });

  // Redirect to lobby after deletion
  return redirect("/rooms/lobby");
};
