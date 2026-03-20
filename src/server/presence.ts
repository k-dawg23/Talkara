import {
  getAvatarColorForNickname,
  getOrAssignSessionAvatarColor,
  releaseSessionAvatarColor,
} from "./avatar-colors";
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
      releaseSessionAvatarColor(existingClientId);
    }
  }
  room.set(clientId, { clientId, nickname, lastSeenMs: Date.now() });
  getOrAssignSessionAvatarColor(clientId);
}

export function presenceLeave(roomId: string, clientId: string) {
  const room = getRoom(roomId);
  room.delete(clientId);
  releaseSessionAvatarColor(clientId);
}

export function presenceTouch(roomId: string, clientId: string) {
  const room = getRoom(roomId);
  const entry = room.get(clientId);
  if (entry) entry.lastSeenMs = Date.now();
}

/**
 * Avatar fill for a nickname in this room: live session colour when that user is online
 * (same as the presence dot), otherwise stable hash. For the current viewer’s own nickname,
 * pass `viewerClientId` + `viewerNickname` so SSR/history match before SSE connects.
 */
export function getAvatarColorForDisplay(
  roomId: string,
  nickname: string,
  opts?: { viewerClientId?: string; viewerNickname?: string },
): string {
  const want = nickname.trim().toLowerCase();
  if (
    opts?.viewerClientId &&
    opts.viewerNickname &&
    opts.viewerNickname.trim().toLowerCase() === want
  ) {
    return getOrAssignSessionAvatarColor(opts.viewerClientId);
  }
  cleanupStale(roomId);
  const room = getRoom(roomId);
  for (const p of room.values()) {
    if (p.nickname.trim().toLowerCase() === want) {
      return getOrAssignSessionAvatarColor(p.clientId);
    }
  }
  return getAvatarColorForNickname(nickname);
}

/** Sorted, deduplicated online nicknames for a room (same rules as the presence panel). */
export function listOnlineNicknames(roomId: string): string[] {
  cleanupStale(roomId);
  const room = getRoom(roomId);
  const seen = new Set<string>();
  return Array.from(room.values())
    .filter((p) => {
      if (seen.has(p.nickname)) return false;
      seen.add(p.nickname);
      return true;
    })
    .map((p) => p.nickname)
    .sort((a, b) => a.localeCompare(b));
}

export function renderPresenceOob(roomId: string): string {
  cleanupStale(roomId);
  const room = getRoom(roomId);
  const seen = new Set<string>();
  const rows: { nickname: string; clientId: string }[] = [];
  for (const p of room.values()) {
    if (seen.has(p.nickname)) continue;
    seen.add(p.nickname);
    rows.push({ nickname: p.nickname, clientId: p.clientId });
  }
  rows.sort((a, b) => a.nickname.localeCompare(b.nickname));

  const items =
    rows.length === 0
      ? `<div class="text-xs text-tc-300">No one online</div>`
      : `<ul class="flex flex-col gap-1.5">${rows
          .map((r) => {
            const bg = getOrAssignSessionAvatarColor(r.clientId);
            return `<li class="flex items-center gap-2 truncate text-sm text-tc-100"><span class="avatar-color-dot inline-block h-2.5 w-2.5 shrink-0 rounded-full" style="background-color:${bg}"></span>${escapeHtml(r.nickname)}</li>`;
          })
          .join("")}</ul>`;

  return `<div id="presence" hx-swap-oob="innerHTML">
  <div class="mb-2 text-sm font-semibold text-tc-100">Online <span class="ml-1 text-xs font-normal text-tc-300">${rows.length}</span></div>
  ${items}
</div>`;
}
