import { db, settingsTable, sessionsTable, courtsTable, expensesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { APP_TIMEZONE } from "./date";
import { logger } from "./logger";

export async function buildReportText(startDate: string, endDate: string): Promise<string> {
  const sessions = await db
    .select({ session: sessionsTable, courtName: courtsTable.name })
    .from(sessionsTable)
    .leftJoin(courtsTable, eq(sessionsTable.courtId, courtsTable.id))
    .where(
      and(
        eq(sessionsTable.status, "completed"),
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE ${APP_TIMEZONE}) >= ${startDate}`,
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE ${APP_TIMEZONE}) <= ${endDate}`,
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

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; description?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const json = (await res.json()) as { ok?: boolean; description?: string };
    return { ok: !!json.ok, description: json.description };
  } catch (err) {
    logger.error({ err }, "telegram send failed");
    return { ok: false, description: "network error" };
  }
}

async function getSettings() {
  const [s] = await db.select().from(settingsTable);
  return s ?? null;
}

function baghdadParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    yyyy: get("year"),
    mm: get("month"),
    dd: get("day"),
    HH: get("hour") === "24" ? "00" : get("hour"),
    MM: get("minute"),
  };
}

function prevMonthRange(yyyy: string, mm: string): { start: string; end: string } {
  const y = parseInt(yyyy, 10);
  const m = parseInt(mm, 10);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  const pmStr = String(pm).padStart(2, "0");
  return {
    start: `${py}-${pmStr}-01`,
    end: `${py}-${pmStr}-${String(lastDay).padStart(2, "0")}`,
  };
}

const sentMarkers = new Set<string>();

async function tick(): Promise<void> {
  const s = await getSettings();
  if (!s) return;
  if (!s.telegramBotToken || !s.telegramChatId) return;

  const { yyyy, mm, dd, HH, MM } = baghdadParts();
  const today = `${yyyy}-${mm}-${dd}`;
  const hhmm = `${HH}:${MM}`;

  if (s.telegramDailyEnabled && Array.isArray(s.telegramDailyTimes)) {
    const normalized = s.telegramDailyTimes.map((t) => {
      const [h, m] = t.split(":");
      return `${(h ?? "00").padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
    });
    if (normalized.includes(hhmm)) {
      const marker = `daily|${today}|${hhmm}`;
      if (!sentMarkers.has(marker)) {
        sentMarkers.add(marker);
        const text = await buildReportText(today, today);
        const r = await sendTelegramMessage(s.telegramBotToken, s.telegramChatId, text);
        if (r.ok) {
          logger.info({ marker }, "telegram daily report sent");
        } else {
          logger.error({ marker, description: r.description }, "telegram daily report failed");
          sentMarkers.delete(marker);
        }
      }
    }
  }

  if (s.telegramMonthlyEnabled && dd === "01" && hhmm === "00:05") {
    const marker = `monthly|${yyyy}-${mm}`;
    if (!sentMarkers.has(marker)) {
      sentMarkers.add(marker);
      const { start, end } = prevMonthRange(yyyy, mm);
      const text = await buildReportText(start, end);
      const r = await sendTelegramMessage(s.telegramBotToken, s.telegramChatId, text);
      if (r.ok) {
        logger.info({ marker }, "telegram monthly report sent");
      } else {
        logger.error({ marker, description: r.description }, "telegram monthly report failed");
        sentMarkers.delete(marker);
      }
    }
  }

  if (sentMarkers.size > 200) {
    const cutoffPrefix = `daily|${today}`;
    for (const k of sentMarkers) {
      if (!k.startsWith(cutoffPrefix) && !k.startsWith(`monthly|${yyyy}-${mm}`)) {
        sentMarkers.delete(k);
      }
    }
  }
}

let started = false;

export function startTelegramScheduler(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    tick().catch((err) => logger.error({ err }, "telegram scheduler tick failed"));
  }, 60_000);
  logger.info("telegram scheduler started (60s interval)");
}
