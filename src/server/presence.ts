import { escapeHtml } from "./render";

const STALE_THRESHOLD_MS = 30000; // 30 seconds

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

function cleanupStale(roomId: string) {
  const room = getRoom(roomId);
  const now = Date.now();
  for (const [clientId, entry] of room.entries()) {
    if (now - entry.lastSeenMs > STALE_THRESHOLD_MS) {
      room.delete(clientId);
    }
  }
}

export function presenceJoin(roomId: string, clientId: string, nickname: string) {
  const room = getRoom(roomId);
  // Remove any stale entries first
  cleanupStale(roomId);
  // Remove any existing entries with the same nickname to prevent duplicates
  for (const [existingClientId, entry] of room.entries()) {
    if (entry.nickname === nickname && existingClientId !== clientId) {
      room.delete(existingClientId);
    }
  }
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
  cleanupStale(roomId);
  const room = getRoom(roomId);
  // Deduplicate nicknames while preserving order
  const seen = new Set<string>();
  const names = Array.from(room.values())
    .filter((p) => {
      if (seen.has(p.nickname)) return false;
      seen.add(p.nickname);
      return true;
    })
    .map((p) => p.nickname)
    .sort((a, b) => a.localeCompare(b));

  const items =
    names.length === 0
      ? `<div class="text-xs text-tc-300">No one online</div>`
      : `<ul class="flex flex-col gap-1.5">${names
          .map(
            (n) =>
              `<li class="flex items-center gap-2 truncate text-sm text-tc-100"><span class="inline-block h-2 w-2 shrink-0 rounded-full bg-green-400"></span>${escapeHtml(n)}</li>`,
          )
          .join("")}</ul>`;

  return `<div id="presence" hx-swap-oob="innerHTML">
  <div class="mb-2 text-sm font-semibold text-tc-100">Online <span class="ml-1 text-xs font-normal text-tc-300">${names.length}</span></div>
  ${items}
</div>`;
}
