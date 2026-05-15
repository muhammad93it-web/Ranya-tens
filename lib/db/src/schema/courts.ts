import { pgTable, serial, text, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courtStatusEnum = pgEnum("court_status", ["idle", "active"]);

export const courtsTable = pgTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  status: courtStatusEnum("status").notNull().default("idle"),
});

export const insertCourtSchema = createInsertSchema(courtsTable).omit({ id: true, status: true });
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courtsTable.$inferSelect;
