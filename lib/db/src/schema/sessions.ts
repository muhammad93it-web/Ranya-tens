import { pgTable, serial, integer, timestamp, numeric, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { courtsTable } from "./courts";

export const sessionStatusEnum = pgEnum("session_status", ["active", "completed"]);

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  courtId: integer("court_id").notNull().references(() => courtsTable.id),
  customerName: varchar("customer_name", { length: 100 }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: numeric("duration_minutes", { precision: 10, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  status: sessionStatusEnum("status").notNull().default("active"),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, endedAt: true, durationMinutes: true, totalCost: true, status: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
