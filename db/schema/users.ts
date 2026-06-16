import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  requestedRole: text("requested_role"),
  phone: text("phone"),
  pronouns: text("pronouns"),
  // "active" | "invited" | "inactive". Defaults to "active" so existing rows
  // (people who already signed up) stay correct after the migration; the
  // invite flow sets "invited" explicitly.
  status: text("status").notNull().default("active"),
  // Keys of the in-app coachmark walkthroughs this user has finished or
  // dismissed (e.g. "dashboard", "productions", "production-hub"). A tour
  // auto-starts only when its key is absent; the "Replay walkthroughs"
  // control in Settings clears this back to empty.
  toursSeen: text("tours_seen").array().notNull().default([]),
  // Which org this user is currently viewing. Nullable: when null,
  // `getCurrentUser` falls back to the user's first active membership. Set
  // by the org switcher; ON DELETE SET NULL so deleting an org doesn't
  // strand its former members.
  selectedOrganizationId: uuid("selected_organization_id").references(
    () => organizations.id,
    { onDelete: "set null" },
  ),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
