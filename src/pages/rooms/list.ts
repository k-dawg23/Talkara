import type { APIRoute } from "astro";
import { getNickname } from "../../server/cookies";
import { listRooms } from "../../server/rooms";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  const nickname = getNickname(cookies);
  if (!nickname) return new Response("", { status: 401 });

  const current = (url.searchParams.get("current") ?? "").trim();
  const rooms = await listRooms();

  const html = rooms
    .map((r) => {
      const cls =
        r.slug === current
          ? "bg-tc-700 text-tc-50"
          : "text-tc-200";
      return `<li><a href="/rooms/${r.slug}" class="block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-tc-800 ${cls}">${r.name}</a></li>`;
    })
    .join("");

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
};

