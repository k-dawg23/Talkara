import type { APIRoute } from "astro";
import { getOrSetClientId, setNickname } from "../../server/cookies";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const nickname = String(form.get("nickname") ?? "").trim();

  if (!nickname || nickname.length < 2 || nickname.length > 24) {
    return redirect("/nick?error=Nickname%20must%20be%202-24%20chars");
  }

  getOrSetClientId(cookies);
  setNickname(cookies, nickname);
  return redirect("/rooms/lobby");
};

