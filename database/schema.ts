// Drizzle ORM 0.45 schema — single source of truth for TypeScript + SQL
import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core"

export const orgTypeEnum = pgEnum("org_type", [
  "school", "college", "corporate", "hospital", "ngo", "factory"
])

export const statusEnum = pgEnum("status", [
  "draft", "generating", "ready", "error"
])

export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  clerkId:   text("clerk_id").unique().notNull(),
  email:     text("email"),
  name:      text("name"),
  plan:      text("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const timetables = pgTable("timetables", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  orgType:   orgTypeEnum("org_type").notNull(),
  country:   text("country").notNull(),
  config:    jsonb("config").default({}),
  // Full timetable data: sections, staff, periods, classTT, teacherTT
  data:      jsonb("data").default({}),
  status:    statusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const substitutions = pgTable("substitutions", {
  id:            uuid("id").primaryKey().defaultRandom(),
  timetableId:   uuid("timetable_id").references(() => timetables.id, { onDelete: "cascade" }),
  absentStaff:   text("absent_staff").notNull(),
  day:           text("day").notNull(),
  substitutions: jsonb("substitutions").default([]),
  appliedAt:     timestamp("applied_at").defaultNow(),
})
