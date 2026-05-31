import { Router, type IRouter } from "express";
import { db, sessionsTable, courtsTable, expensesTable, winnersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { APP_TIMEZONE, todayLocal } from "../lib/date";

const router: IRouter = Router();

router.get("/reports/summary", requireAuth, async (req, res): Promise<void> => {
  const { date, startDate, endDate } = req.query as Record<string, string | undefined>;

  const today = todayLocal();
  let filterStart = startDate ?? date ?? today;
  let filterEnd = endDate ?? date ?? today;

  // Cashier can only see today's data, regardless of requested range
  if (req.session.role === "cashier") {
    filterStart = today;
    filterEnd = today;
  }

  const sessionRows = await db
    .select({
      session: sessionsTable,
      courtName: courtsTable.name,
    })
    .from(sessionsTable)
    .leftJoin(courtsTable, eq(sessionsTable.courtId, courtsTable.id))
    .where(
      and(
        eq(sessionsTable.status, "completed"),
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE ${APP_TIMEZONE}) >= ${filterStart}`,
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE ${APP_TIMEZONE}) <= ${filterEnd}`,
      ),
    )
    .orderBy(sql`${sessionsTable.startedAt} DESC`);

  const expenseRows = await db
    .select()
    .from(expensesTable)
    .where(
      and(
        sql`${expensesTable.date} >= ${filterStart}`,
        sql`${expensesTable.date} <= ${filterEnd}`,
      ),
    )
    .orderBy(sql`${expensesTable.date} DESC, ${expensesTable.id} DESC`);

  const winnerRows = await db
    .select()
    .from(winnersTable)
    .where(
      and(
        eq(winnersTable.counted, true),
        sql`${winnersTable.date} >= ${filterStart}`,
        sql`${winnersTable.date} <= ${filterEnd}`,
      ),
    );

  const sessionsIncome = sessionRows.reduce(
    (sum, r) => sum + (r.session.totalCost ? parseFloat(r.session.totalCost) : 0),
    0,
  );
  const winnersIncome = winnerRows.reduce(
    (sum, w) => sum + parseFloat(w.amount),
    0,
  );
  const totalIncome = sessionsIncome + winnersIncome;
  const totalExpenses = expenseRows.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0,
  );

  const sessions = sessionRows.map((r) => ({
    id: r.session.id,
    courtId: r.session.courtId,
    courtName: r.courtName ?? "نەزانراو",
    customerName: r.session.customerName ?? null,
    startedAt: r.session.startedAt.toISOString(),
    endedAt: r.session.endedAt ? r.session.endedAt.toISOString() : null,
    durationMinutes: r.session.durationMinutes ? parseFloat(r.session.durationMinutes) : null,
    totalCost: r.session.totalCost ? parseFloat(r.session.totalCost) : null,
    status: r.session.status,
  }));

  const expenses = expenseRows.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    amount: parseFloat(e.amount),
    notes: e.notes,
    date: e.date,
  }));

  res.json({
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    sessions,
    expenses,
  });
});

router.get("/reports/dashboard", requireAuth, async (_req, res): Promise<void> => {
  const today = todayLocal();

  const [activeSessions, todaySessions, todayWinners] = await Promise.all([
    db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "active")),
    db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.status, "completed"),
          sql`DATE(${sessionsTable.startedAt} AT TIME ZONE ${APP_TIMEZONE}) = ${today}`,
        ),
      ),
    db
      .select()
      .from(winnersTable)
      .where(
        and(
          eq(winnersTable.counted, true),
          sql`${winnersTable.date} = ${today}`,
        ),
      ),
  ]);

  const totalCourts = await db.select().from(courtsTable);

  const todayIncome =
    todaySessions.reduce(
      (sum, s) => sum + (s.totalCost ? parseFloat(s.totalCost) : 0),
      0,
    ) +
    todayWinners.reduce((sum, w) => sum + parseFloat(w.amount), 0);

  const totalActiveCourts = activeSessions.length;
  const totalIdleCourts = totalCourts.length - totalActiveCourts;

  res.json({
    totalActiveCourts,
    totalIdleCourts,
    todayIncome,
    activeSessions: totalActiveCourts,
  });
});

export default router;
