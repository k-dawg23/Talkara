import type { AstroCookies } from "astro";
import { randomUUID } from "node:crypto";

export function getNickname(cookies: AstroCookies): string | null {
  const v = cookies.get("nickname")?.value?.trim();
  return v ? v : null;
}

export function getOrSetClientId(cookies: AstroCookies): string {
  const existing = cookies.get("clientId")?.value?.trim();
  if (existing) return existing;

  const id = randomUUID();
  cookies.set("clientId", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export function getClientId(cookies: AstroCookies): string | null {
  const v = cookies.get("clientId")?.value?.trim();
  return v ? v : null;
}

export function setNickname(cookies: AstroCookies, nickname: string) {
  cookies.set("nickname", nickname, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

