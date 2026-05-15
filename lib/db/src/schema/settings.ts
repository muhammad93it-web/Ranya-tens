import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  systemName: text("system_name").notNull().default("Tennis Ranya"),
  themeColor: text("theme_color").notNull().default("dark-blue"),
  telegramApiKey: text("telegram_api_key"),
  discordWebhookUrl: text("discord_webhook_url"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
