import { Router, type IRouter } from "express";
import { db, sessionsTable, courtsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  CreateSessionBody,
  GetSessionParams,
  DeleteSessionParams,
  EndSessionParams,
  GetSessionsQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatSession(session: typeof sessionsTable.$inferSelect, courtName: string) {
  return {
    id: session.id,
    courtId: session.courtId,
    courtName,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    durationMinutes: session.durationMinutes ? parseFloat(session.durationMinutes) : null,
    totalCost: session.totalCost ? parseFloat(session.totalCost) : null,
    status: session.status,
  };
}

router.get("/sessions", requireAuth, async (req, res): Promise<void> => {
  const qp = GetSessionsQueryParams.safeParse(req.query);

  const rows = await db
    .select({
      session: sessionsTable,
      courtName: courtsTable.name,
    })
    .from(sessionsTable)
    .leftJoin(courtsTable, eq(sessionsTable.courtId, courtsTable.id))
    .orderBy(sql`${sessionsTable.startedAt} DESC`);

  const result = rows.map((r) =>
    formatSession(r.session, r.courtName ?? "نەزانراو"),
  );

  res.json(result);
});

router.post("/sessions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { courtId } = parsed.data;

  const [court] = await db
    .select()
    .from(courtsTable)
    .where(eq(courtsTable.id, courtId));

  if (!court) {
    res.status(404).json({ error: "مێز نەدۆزرایەوە" });
    return;
  }

  const [activeSession] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.courtId, courtId), eq(sessionsTable.status, "active")));

  if (activeSession) {
    res.status(400).json({ error: "ئەم مێزە ئێستا کارایە" });
    return;
  }

  await db
    .update(courtsTable)
    .set({ status: "active" })
    .where(eq(courtsTable.id, courtId));

  const [session] = await db
    .insert(sessionsTable)
    .values({
      courtId,
      startedAt: new Date(),
    })
    .returning();

  res.status(201).json(formatSession(session, court.name));
});

router.get("/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      session: sessionsTable,
      courtName: courtsTable.name,
    })
    .from(sessionsTable)
    .leftJoin(courtsTable, eq(sessionsTable.courtId, courtsTable.id))
    .where(eq(sessionsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "سەشن نەدۆزرایەوە" });
    return;
  }

  res.json(formatSession(row.session, row.courtName ?? "نەزانراو"));
});

router.delete("/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.id, params.data.id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "سەشن نەدۆزرایەوە" });
    return;
  }

  res.json({ success: true });
});

router.post("/sessions/:id/end", requireAuth, async (req, res): Promise<void> => {
  const params = EndSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      session: sessionsTable,
      court: courtsTable,
    })
    .from(sessionsTable)
    .leftJoin(courtsTable, eq(sessionsTable.courtId, courtsTable.id))
    .where(and(eq(sessionsTable.id, params.data.id), eq(sessionsTable.status, "active")));

  if (!row || !row.court) {
    res.status(404).json({ error: "سەشنی چالاک نەدۆزرایەوە" });
    return;
  }

  const now = new Date();
  const elapsedMs = now.getTime() - row.session.startedAt.getTime();
  const durationMinutes = elapsedMs / (1000 * 60);
  const hourlyRate = parseFloat(row.court.hourlyRate);
  const totalCost = (durationMinutes / 60) * hourlyRate;

  const [updatedSession] = await db
    .update(sessionsTable)
    .set({
      endedAt: now,
      durationMinutes: String(durationMinutes),
      totalCost: String(totalCost),
      status: "completed",
    })
    .where(eq(sessionsTable.id, params.data.id))
    .returning();

  await db
    .update(courtsTable)
    .set({ status: "idle" })
    .where(eq(courtsTable.id, row.session.courtId));

  res.json(formatSession(updatedSession, row.court.name));
});

export default router;
