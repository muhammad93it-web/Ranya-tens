import { Router, type IRouter } from "express";
import { db, winnersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateWinnerBody,
  UpdateWinnerBody,
  UpdateWinnerParams,
  DeleteWinnerParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { todayLocal } from "../lib/date";

const router: IRouter = Router();

function serialize(w: typeof winnersTable.$inferSelect) {
  return {
    id: w.id,
    name: w.name,
    sets: w.sets,
    amount: parseFloat(w.amount),
    counted: w.counted,
    date: w.date,
  };
}

router.get("/winners", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(winnersTable).orderBy(winnersTable.id);
  res.json(rows.map(serialize));
});

router.post("/winners", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateWinnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [winner] = await db
    .insert(winnersTable)
    .values({
      name: parsed.data.name ?? null,
      sets: parsed.data.sets ?? 0,
      amount: String(parsed.data.amount ?? 0),
      counted: parsed.data.counted ?? false,
      date: parsed.data.date ?? todayLocal(),
    })
    .returning();

  res.status(201).json(serialize(winner));
});

router.patch("/winners/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateWinnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWinnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof winnersTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.sets !== undefined) updateData.sets = parsed.data.sets;
  if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
  if (parsed.data.counted !== undefined) updateData.counted = parsed.data.counted;

  const [winner] = await db
    .update(winnersTable)
    .set(updateData)
    .where(eq(winnersTable.id, params.data.id))
    .returning();

  if (!winner) {
    res.status(404).json({ error: "تۆمار نەدۆزرایەوە" });
    return;
  }

  res.json(serialize(winner));
});

router.delete("/winners/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteWinnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [winner] = await db
    .delete(winnersTable)
    .where(eq(winnersTable.id, params.data.id))
    .returning();

  if (!winner) {
    res.status(404).json({ error: "تۆمار نەدۆزرایەوە" });
    return;
  }

  res.json({ success: true });
});

export default router;
