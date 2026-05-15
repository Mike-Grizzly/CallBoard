import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

export const customSetPieces = pgTable("custom_set_pieces", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  storagePath: text("storage_path").notNull(),
  fileType: text("file_type").notNull(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CustomSetPiece = typeof customSetPieces.$inferSelect;
export type NewCustomSetPiece = typeof customSetPieces.$inferInsert;
