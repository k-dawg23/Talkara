import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear the auth cookies
  cookies.delete("nickname", { path: "/" });
  cookies.delete("clientId", { path: "/" });
  return redirect("/nick");
};
