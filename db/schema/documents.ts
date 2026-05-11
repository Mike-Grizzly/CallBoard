import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

export const documentFolders = pgTable("document_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => documentFolders.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  storagePath: text("storage_path").notNull(),
  documentType: text("document_type").notNull().default("general"),
  processingStatus: text("processing_status").notNull().default("none"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DocumentFolder = typeof documentFolders.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
