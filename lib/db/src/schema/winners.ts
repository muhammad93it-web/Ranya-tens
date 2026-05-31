import { pgTable, serial, text, integer, numeric, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const winnersTable = pgTable("winners", {
  id: serial("id").primaryKey(),
  name: text("name"),
  sets: integer("sets").notNull().default(0),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  counted: boolean("counted").notNull().default(false),
  date: date("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWinnerSchema = createInsertSchema(winnersTable).omit({ id: true });
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Winner = typeof winnersTable.$inferSelect;
