/** Saturated fills that read clearly with white initials in both light and dark UI. */
export const AVATAR_PALETTE = [
  "#1d4ed8",
  "#b91c1c",
  "#15803d",
  "#a16207",
  "#6d28d9",
  "#be185d",
  "#0f766e",
  "#c2410c",
  "#4338ca",
  "#0e7490",
  "#92400e",
  "#7c3aed",
] as const;

const globalKey = "__talkaraAvatarColors__";
const sessionByClient: Map<string, string> =
  (globalThis as unknown as Record<string, Map<string, string>>)[globalKey] ?? new Map<string, string>();
(globalThis as unknown as Record<string, unknown>)[globalKey] = sessionByClient;

/** Stable colour for persisted history / SSR when we only have a nickname (no live session). */
export function getAvatarColorForNickname(nickname: string): string {
  const s = nickname.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx]!;
}

/**
 * Random colour on first use per clientId while online; same across rooms until disconnect.
 * Call from presence join and when rendering live messages for that client.
 */
export function getOrAssignSessionAvatarColor(clientId: string): string {
  let c = sessionByClient.get(clientId);
  if (!c) {
    c = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)]!;
    sessionByClient.set(clientId, c);
  }
  return c;
}

export function releaseSessionAvatarColor(clientId: string): void {
  sessionByClient.delete(clientId);
}
