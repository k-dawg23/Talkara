import { db } from "../db/client";
import { rooms } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getOrCreateLobby() {
  const existing = await db.select().from(rooms).where(eq(rooms.slug, "lobby")).limit(1);
  if (existing) return existing;

  const inserted = await db
    .insert(rooms)
    .values({ slug: "lobby", name: "Lobby" })
    .returning();
  return inserted[0]!;
}

export async function getRoomBySlug(slug: string) {
  const found = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
  return found[0] ?? null;
}

export async function listRooms() {
  return db.select().from(rooms).orderBy(rooms.createdAt);
}

export async function createRoom(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const base = slug || "room";
  let candidate = base;
  for (let i = 2; i < 100; i++) {
    const existing = await db.select().from(rooms).where(eq(rooms.slug, candidate)).limit(1);
    if (existing.length === 0) break;
    candidate = `${base}-${i}`;
  }

  const inserted = await db
    .insert(rooms)
    .values({ name: name.trim(), slug: candidate })
    .returning();

  return inserted[0]!;
}

