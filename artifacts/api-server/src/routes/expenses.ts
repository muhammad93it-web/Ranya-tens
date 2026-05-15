import { Router, type IRouter } from "express";
import { db, expensesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateExpenseBody,
  DeleteExpenseParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatExpense(e: typeof expensesTable.$inferSelect) {
  return {
    id: e.id,
    type: e.type,
    amount: parseFloat(e.amount),
    date: e.date,
  };
}

router.get("/expenses", requireAuth, async (req, res): Promise<void> => {
  const expenses = await db
    .select()
    .from(expensesTable)
    .orderBy(sql`${expensesTable.date} DESC`);

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
      type: parsed.data.type,
      amount: String(parsed.data.amount),
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

export default router;
