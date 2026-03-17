import { pgEnum, pgTable, text, timestamp, uuid, bigserial, index } from "drizzle-orm/pg-core";

export const messageKind = pgEnum("message_kind", ["user", "system"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    kind: messageKind("kind").notNull().default("user"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_room_created_at_idx").on(t.roomId, t.createdAt)],
);

