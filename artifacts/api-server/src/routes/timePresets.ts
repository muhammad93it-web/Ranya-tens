import { Router, type IRouter } from "express";
import { db, timePresetsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  CreateTimePresetBody,
  UpdateTimePresetBody,
  UpdateTimePresetParams,
  DeleteTimePresetParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function format(p: typeof timePresetsTable.$inferSelect) {
  return { id: p.id, label: p.label, minutes: p.minutes };
}

router.get("/time-presets", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(timePresetsTable).orderBy(asc(timePresetsTable.minutes));
  res.json(rows.map(format));
});

router.post("/time-presets", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateTimePresetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(timePresetsTable)
    .values({ label: parsed.data.label, minutes: parsed.data.minutes })
    .returning();
  res.status(201).json(format(row));
});

router.patch("/time-presets/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateTimePresetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTimePresetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, string | number> = {};
  if (parsed.data.label !== undefined) updateData.label = parsed.data.label;
  if (parsed.data.minutes !== undefined) updateData.minutes = parsed.data.minutes;

  const [row] = await db
    .update(timePresetsTable)
    .set(updateData)
    .where(eq(timePresetsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "کات نەدۆزرایەوە" });
    return;
  }
  res.json(format(row));
});

router.delete("/time-presets/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteTimePresetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(timePresetsTable)
    .where(eq(timePresetsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "کات نەدۆزرایەوە" });
    return;
  }
  res.json({ success: true });
});

export default router;
