import { Router, type IRouter } from "express";
import { db, expensesTable, expenseTypesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateExpenseBody,
  DeleteExpenseParams,
  CreateExpenseTypeBody,
  DeleteExpenseTypeParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatExpense(e: typeof expensesTable.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    amount: parseFloat(e.amount),
    notes: e.notes,
    date: e.date,
  };
}

router.get("/expenses", requireAuth, async (_req, res): Promise<void> => {
  const expenses = await db
    .select()
    .from(expensesTable)
    .orderBy(sql`${expensesTable.date} DESC, ${expensesTable.id} DESC`);

  res.json(expenses.map(formatExpense));
});

router.post("/expenses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const [expense] = await db
    .insert(expensesTable)
    .values({
      title: parsed.data.title ?? null,
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      notes: parsed.data.notes ?? null,
      date: parsed.data.date ?? today,
    })
    .returning();

  res.status(201).json(formatExpense(expense));
});

router.delete("/expenses/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "خەرجی نەدۆزرایەوە" });
    return;
  }

  res.json({ success: true });
});

router.get("/expense-types", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(expenseTypesTable).orderBy(expenseTypesTable.id);
  res.json(rows);
});

router.post("/expense-types", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateExpenseTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const label = parsed.data.label.trim();
  if (!label) {
    res.status(400).json({ error: "ناوی جۆر بەتاڵە" });
    return;
  }

  try {
    const [row] = await db.insert(expenseTypesTable).values({ label }).returning();
    res.status(201).json(row);
  } catch {
    res.status(409).json({ error: "ئەم جۆرە پێشتر هەیە" });
  }
});

router.delete("/expense-types/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteExpenseTypeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(expenseTypesTable)
    .where(eq(expenseTypesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "نەدۆزرایەوە" });
    return;
  }
  res.json({ success: true });
});

export default router;
