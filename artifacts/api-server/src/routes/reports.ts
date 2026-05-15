import { Router, type IRouter } from "express";
import { db, sessionsTable, courtsTable, expensesTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/reports/summary", requireAuth, async (req, res): Promise<void> => {
  const { date, startDate, endDate } = req.query as Record<string, string | undefined>;

  const today = new Date().toISOString().split("T")[0];
  const filterDate = date ?? today;
  const filterStart = startDate ?? filterDate;
  const filterEnd = endDate ?? filterDate;

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
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE 'UTC') >= ${filterStart}`,
        sql`DATE(${sessionsTable.startedAt} AT TIME ZONE 'UTC') <= ${filterEnd}`,
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
    .orderBy(sql`${expensesTable.date} DESC`);

  const totalIncome = sessionRows.reduce(
    (sum, r) => sum + (r.session.totalCost ? parseFloat(r.session.totalCost) : 0),
    0,
  );
  const totalExpenses = expenseRows.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0,
  );

  const sessions = sessionRows.map((r) => ({
    id: r.session.id,
    courtId: r.session.courtId,
    courtName: r.courtName ?? "نەزانراو",
    startedAt: r.session.startedAt.toISOString(),
    endedAt: r.session.endedAt ? r.session.endedAt.toISOString() : null,
    durationMinutes: r.session.durationMinutes ? parseFloat(r.session.durationMinutes) : null,
    totalCost: r.session.totalCost ? parseFloat(r.session.totalCost) : null,
    status: r.session.status,
  }));

  const expenses = expenseRows.map((e) => ({
    id: e.id,
    type: e.type,
    amount: parseFloat(e.amount),
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
  const today = new Date().toISOString().split("T")[0];

  const [activeSessions, todaySessions] = await Promise.all([
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
          sql`DATE(${sessionsTable.startedAt} AT TIME ZONE 'UTC') = ${today}`,
        ),
      ),
  ]);

  const totalCourts = await db.select().from(courtsTable);

  const todayIncome = todaySessions.reduce(
    (sum, s) => sum + (s.totalCost ? parseFloat(s.totalCost) : 0),
    0,
  );

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
