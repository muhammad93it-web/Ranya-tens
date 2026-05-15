import { Router, type IRouter } from "express";
import { db, settingsTable, sessionsTable, courtsTable, expensesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { UpdateSettingsBody, SendTelegramReportBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

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
    cashierPermissions: s.cashierPermissions ?? [],
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

async function buildReportText(startDate: string, endDate: string): Promise<string> {
  const sessions = await db
    .select({
      session: sessionsTable,
      courtName: courtsTable.name,
    })
    .from(sessionsTable)
    .leftJoin(courtsTable, eq(sessionsTable.courtId, courtsTable.id))
    .where(
      and(
        eq(sessionsTable.status, "completed"),
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE 'UTC') >= ${startDate}`,
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE 'UTC') <= ${endDate}`,
      ),
    );

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(
      and(
        sql`${expensesTable.date} >= ${startDate}`,
        sql`${expensesTable.date} <= ${endDate}`,
      ),
    );

  const totalIncome = sessions.reduce(
    (sum, r) => sum + (r.session.totalCost ? parseFloat(r.session.totalCost) : 0),
    0,
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  return [
    `📊 ڕاپۆرتی Tennis Ranya`,
    `📅 ${startDate} — ${endDate}`,
    ``,
    `💰 کۆی داهات: ${totalIncome.toFixed(0)} د.ع`,
    `💸 کۆی خەرجی: ${totalExpenses.toFixed(0)} د.ع`,
    `${netProfit >= 0 ? "✅" : "⚠️"} قازانجی پوختە: ${netProfit.toFixed(0)} د.ع`,
    ``,
    `🎾 ژمارەی یاری: ${sessions.length}`,
    `📝 ژمارەی خەرجی: ${expenses.length}`,
  ].join("\n");
}

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

  const today = new Date().toISOString().split("T")[0];
  const startDate = parsed.data.startDate ?? today;
  const endDate = parsed.data.endDate ?? today;

  const text = await buildReportText(startDate, endDate);

  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: settings.telegramChatId, text }),
    });
    const json = (await tgRes.json()) as { ok?: boolean; description?: string };
    if (!json.ok) {
      res.status(502).json({ error: json.description ?? "نەنێردرا بۆ تێلێگرام" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log?.error({ err }, "telegram send failed");
    res.status(502).json({ error: "هەڵە لە پەیوەندیکردن بە تێلێگرام" });
  }
});

export default router;
