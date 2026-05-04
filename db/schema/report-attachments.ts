import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { rehearsalReports } from "./rehearsal-reports";
import { profiles } from "./users";

export const reportAttachments = pgTable("report_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => rehearsalReports.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ReportAttachment = typeof reportAttachments.$inferSelect;
export type NewReportAttachment = typeof reportAttachments.$inferInsert;
