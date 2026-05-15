import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody, SendTelegramReportBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { todayLocal } from "../lib/date";
import { buildReportText, sendTelegramMessage } from "../lib/telegram";

const router: IRouter = Router();

type SettingsRow = typeof settingsTable.$inferSelect;

async function getOrCreateSettings(): Promise<SettingsRow> {
  const [existing] = await db.select().from(settingsTable);
  if (existing) return existing;
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

function formatSettings(s: SettingsRow, isAdmin: boolean) {
  return {
    id: s.id,
    systemName: s.systemName,
    themeColor: s.themeColor,
    shopName: s.shopName ?? null,
    marketCategory: s.marketCategory ?? null,
    phoneNumber: s.phoneNumber ?? null,
    address: s.address ?? null,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    // Telegram credentials are admin-only — never leak to cashiers
    telegramBotToken: isAdmin ? (s.telegramBotToken ?? null) : null,
    telegramChatId: isAdmin ? (s.telegramChatId ?? null) : null,
    telegramDailyEnabled: s.telegramDailyEnabled,
    telegramMonthlyEnabled: s.telegramMonthlyEnabled,
    telegramDailyTimes: s.telegramDailyTimes ?? [],
  };
}

router.get("/settings", requireAuth, async (req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(formatSettings(settings, req.session.role === "admin"));
});

router.patch("/settings", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();
  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  res.json(formatSettings(updated, true));
});

router.post("/telegram/send-report", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = SendTelegramReportBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    res.status(400).json({ error: "بۆت تۆکێن یان چات ئایدی ڕێکنەخراون" });
    return;
  }

  const today = todayLocal();
  const startDate = parsed.data.startDate ?? today;
  const endDate = parsed.data.endDate ?? today;

  const text = await buildReportText(startDate, endDate);
  const result = await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, text);
  if (!result.ok) {
    res.status(502).json({ error: result.description ?? "نەنێردرا بۆ تێلێگرام" });
    return;
  }
  res.json({ success: true });
});

export default router;
