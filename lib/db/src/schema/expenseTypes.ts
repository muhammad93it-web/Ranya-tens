import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const expenseTypesTable = pgTable("expense_types", {
  id: serial("id").primaryKey(),
  label: text("label").notNull().unique(),
});

export const insertExpenseTypeSchema = createInsertSchema(expenseTypesTable).omit({ id: true });
export type InsertExpenseType = z.infer<typeof insertExpenseTypeSchema>;
export type ExpenseType = typeof expenseTypesTable.$inferSelect;
