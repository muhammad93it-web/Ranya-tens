import { pgTable, serial, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  systemName: text("system_name").notNull().default("Tennis Ranya"),
  themeColor: text("theme_color").notNull().default("dark-blue"),

  shopName: text("shop_name"),
  marketCategory: text("market_category"),
  phoneNumber: text("phone_number"),
  address: text("address"),

  fontFamily: text("font_family").notNull().default("default"),
  fontSize: text("font_size").notNull().default("medium"),

  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  telegramDailyEnabled: boolean("telegram_daily_enabled").notNull().default(false),
  telegramMonthlyEnabled: boolean("telegram_monthly_enabled").notNull().default(false),
  telegramDailyTimes: jsonb("telegram_daily_times").$type<string[]>().notNull().default([]),

  cashierPermissions: jsonb("cashier_permissions")
    .$type<string[]>()
    .notNull()
    .default(["/map", "/dashboard", "/times", "/reports", "/expenses"]),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
