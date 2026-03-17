import { EventEmitter } from "node:events";

type RoomEvent =
  | { type: "message"; html: string }
  | { type: "presence"; html: string }
  | { type: "typing"; html: string }
  | { type: "roomsUpdated"; html: string };

type Listener = (evt: RoomEvent) => void;

type RoomState = {
  emitter: EventEmitter;
  listeners: Set<Listener>;
};

const globalKey = "__talkaraRoomHub__";
const rooms: Map<string, RoomState> = (
  globalThis as unknown as Record<string, unknown>
)[globalKey] as Map<string, RoomState> ?? new Map<string, RoomState>();

(
  globalThis as unknown as Record<string, unknown>
)[globalKey] = rooms;

function getRoom(roomId: string): RoomState {
  const existing = rooms.get(roomId);
  if (existing) return existing;

  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);

  const state: RoomState = { emitter, listeners: new Set() };
  rooms.set(roomId, state);
  return state;
}

export function subscribe(roomId: string, listener: Listener): () => void {
  const room = getRoom(roomId);
  room.listeners.add(listener);
  return () => {
    room.listeners.delete(listener);
  };
}

export function broadcast(roomId: string, evt: RoomEvent) {
  const room = getRoom(roomId);
  for (const listener of room.listeners) listener(evt);
}

export function broadcastAll(evt: RoomEvent) {
  for (const room of rooms.values()) {
    for (const listener of room.listeners) listener(evt);
  }
}

