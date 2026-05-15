import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timePresetsTable = pgTable("time_presets", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  minutes: integer("minutes").notNull(),
});

export const insertTimePresetSchema = createInsertSchema(timePresetsTable).omit({ id: true });
export type InsertTimePreset = z.infer<typeof insertTimePresetSchema>;
export type TimePreset = typeof timePresetsTable.$inferSelect;
