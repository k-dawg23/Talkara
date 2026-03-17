import { escapeHtml } from "./render";

type PresenceEntry = {
  clientId: string;
  nickname: string;
  lastSeenMs: number;
};

type RoomPresence = Map<string, PresenceEntry>;

const globalKey = "__talkaraPresence__";
const byRoom: Map<string, RoomPresence> = (
  globalThis as unknown as Record<string, unknown>
)[globalKey] as Map<string, RoomPresence> ?? new Map<string, RoomPresence>();
(
  globalThis as unknown as Record<string, unknown>
)[globalKey] = byRoom;

function getRoom(roomId: string): RoomPresence {
  const existing = byRoom.get(roomId);
  if (existing) return existing;
  const map: RoomPresence = new Map();
  byRoom.set(roomId, map);
  return map;
}

export function presenceJoin(roomId: string, clientId: string, nickname: string) {
  const room = getRoom(roomId);
  room.set(clientId, { clientId, nickname, lastSeenMs: Date.now() });
}

export function presenceLeave(roomId: string, clientId: string) {
  const room = getRoom(roomId);
  room.delete(clientId);
}

export function presenceTouch(roomId: string, clientId: string) {
  const room = getRoom(roomId);
  const entry = room.get(clientId);
  if (entry) entry.lastSeenMs = Date.now();
}

export function renderPresenceOob(roomId: string): string {
  const room = getRoom(roomId);
  const names = Array.from(room.values())
    .map((p) => p.nickname)
    .sort((a, b) => a.localeCompare(b));

  const items =
    names.length === 0
      ? `<div class="text-xs text-zinc-500">No one online</div>`
      : `<ul class="flex flex-col gap-1">${names
          .map((n) => `<li class="truncate text-sm text-zinc-200">${escapeHtml(n)}</li>`)
          .join("")}</ul>`;

  return `<div id="presence" hx-swap-oob="innerHTML">
  <div class="mb-2 text-sm font-semibold">Online</div>
  ${items}
</div>`;
}

