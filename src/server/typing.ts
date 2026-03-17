import { escapeHtml } from "./render";

type TypingEntry = {
  clientId: string;
  nickname: string;
  expiresAtMs: number;
};

const byRoom = new Map<string, Map<string, TypingEntry>>();

function getRoom(roomId: string) {
  const existing = byRoom.get(roomId);
  if (existing) return existing;
  const m = new Map<string, TypingEntry>();
  byRoom.set(roomId, m);
  return m;
}

function cleanup(roomId: string, now = Date.now()) {
  const room = getRoom(roomId);
  for (const [id, entry] of room.entries()) {
    if (entry.expiresAtMs <= now) room.delete(id);
  }
}

export function typingPing(roomId: string, clientId: string, nickname: string, ttlMs = 2000) {
  const now = Date.now();
  const room = getRoom(roomId);
  room.set(clientId, { clientId, nickname, expiresAtMs: now + ttlMs });
  cleanup(roomId, now);
}

export function renderTypingOob(roomId: string): string {
  cleanup(roomId);
  const room = getRoom(roomId);
  const names = Array.from(room.values())
    .map((e) => e.nickname)
    .sort((a, b) => a.localeCompare(b));

  let text = "";
  if (names.length === 1) text = `${names[0]} is typing…`;
  else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing…`;
  else if (names.length > 2) text = `${names[0]} and ${names.length - 1} others are typing…`;

  return `<div id="typing" hx-swap-oob="innerHTML">${text ? `<span>${escapeHtml(text)}</span>` : ""}</div>`;
}

