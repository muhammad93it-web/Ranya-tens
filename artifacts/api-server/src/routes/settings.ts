import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(settingsTable);
  if (existing) return existing;

  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/settings", requireAuth, async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json({
    id: settings.id,
    systemName: settings.systemName,
    themeColor: settings.themeColor,
    telegramApiKey: settings.telegramApiKey ?? null,
    discordWebhookUrl: settings.discordWebhookUrl ?? null,
  });
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

  res.json({
    id: updated.id,
    systemName: updated.systemName,
    themeColor: updated.themeColor,
    telegramApiKey: updated.telegramApiKey ?? null,
    discordWebhookUrl: updated.discordWebhookUrl ?? null,
  });
});

export default router;
