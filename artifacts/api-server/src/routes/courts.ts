import { Router, type IRouter } from "express";
import { db, courtsTable, sessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateCourtBody,
  UpdateCourtBody,
  GetCourtParams,
  UpdateCourtParams,
  DeleteCourtParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(param: string | string[]): number {
  const raw = Array.isArray(param) ? param[0] : param;
  return parseInt(raw, 10);
}

router.get("/courts", requireAuth, async (req, res): Promise<void> => {
  const courts = await db.select().from(courtsTable).orderBy(courtsTable.id);

  const activeSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.status, "active"));

  const sessionsByCourtId = new Map(
    activeSessions.map((s) => [s.courtId, s]),
  );

  const now = new Date();
  const result = courts.map((court) => {
    const session = sessionsByCourtId.get(court.id);
    if (session) {
      const elapsedMs = now.getTime() - session.startedAt.getTime();
      const elapsedMinutes = elapsedMs / (1000 * 60);
      const hourlyRate = parseFloat(court.hourlyRate);
      const currentCost = (elapsedMinutes / 60) * hourlyRate;
      return {
        id: court.id,
        name: court.name,
        hourlyRate: hourlyRate,
        status: "active",
        activeSessionId: session.id,
        activeSessionStartedAt: session.startedAt.toISOString(),
        activeSessionElapsedMinutes: elapsedMinutes,
        activeSessionCurrentCost: currentCost,
      };
    }
    return {
      id: court.id,
      name: court.name,
      hourlyRate: parseFloat(court.hourlyRate),
      status: "idle",
      activeSessionId: null,
      activeSessionStartedAt: null,
      activeSessionElapsedMinutes: null,
      activeSessionCurrentCost: null,
    };
  });

  res.json(result);
});

router.post("/courts", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCourtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [court] = await db
    .insert(courtsTable)
    .values({
      name: parsed.data.name,
      hourlyRate: String(parsed.data.hourlyRate),
    })
    .returning();

  res.status(201).json({
    id: court.id,
    name: court.name,
    hourlyRate: parseFloat(court.hourlyRate),
    status: court.status,
    activeSessionId: null,
    activeSessionStartedAt: null,
    activeSessionElapsedMinutes: null,
    activeSessionCurrentCost: null,
  });
});

router.get("/courts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetCourtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [court] = await db
    .select()
    .from(courtsTable)
    .where(eq(courtsTable.id, params.data.id));

  if (!court) {
    res.status(404).json({ error: "مێز نەدۆزرایەوە" });
    return;
  }

  res.json({
    id: court.id,
    name: court.name,
    hourlyRate: parseFloat(court.hourlyRate),
    status: court.status,
    activeSessionId: null,
    activeSessionStartedAt: null,
    activeSessionElapsedMinutes: null,
    activeSessionCurrentCost: null,
  });
});

router.patch("/courts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCourtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCourtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, string> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.hourlyRate !== undefined)
    updateData.hourlyRate = String(parsed.data.hourlyRate);

  const [court] = await db
    .update(courtsTable)
    .set(updateData)
    .where(eq(courtsTable.id, params.data.id))
    .returning();

  if (!court) {
    res.status(404).json({ error: "مێز نەدۆزرایەوە" });
    return;
  }

  res.json({
    id: court.id,
    name: court.name,
    hourlyRate: parseFloat(court.hourlyRate),
    status: court.status,
    activeSessionId: null,
    activeSessionStartedAt: null,
    activeSessionElapsedMinutes: null,
    activeSessionCurrentCost: null,
  });
});

router.delete("/courts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCourtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [court] = await db
    .delete(courtsTable)
    .where(eq(courtsTable.id, params.data.id))
    .returning();

  if (!court) {
    res.status(404).json({ error: "مێز نەدۆزرایەوە" });
    return;
  }

  res.json({ success: true });
});

export default router;
