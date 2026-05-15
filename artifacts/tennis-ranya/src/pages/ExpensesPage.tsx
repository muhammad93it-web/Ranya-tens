import { useState } from "react";
import { useGetExpenses, useCreateExpense, useDeleteExpense, getGetExpensesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Receipt } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toEnglishDigits } from "@/lib/digits";

const EXPENSE_TYPES = [
  "کرێی شوێن", "موچە", "کارەبا", "ئاو", "ئینتەرنێت", "چاکسازی", "تەواوکردن", "تر",
];

interface Expense {
  id: number;
  type: string;
  amount: number;
  date: string;
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const { data: expenses, isLoading } = useGetExpenses({}, { query: { queryKey: getGetExpensesQueryKey({}) } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !amount) return;
    createExpense.mutate(
      { data: { type, amount: Number(amount), date } },
      {
        onSuccess: () => {
          setType("");
          setAmount("");
          setDate(today);
          queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey({}) });
        },
      },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteExpense.mutate({ id: pendingDelete.id }, {
      onSuccess: () => {
        setPendingDelete(null);
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey({}) });
      },
    });
  }

  const total = (expenses as Expense[] ?? []).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>خەرجییەکان</span>
        <Receipt className="text-primary" size={22} />
      </h1>

      {/* Add form */}
      <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
        <h2 className="text-end text-sm font-semibold text-muted-foreground mb-4">خەرجی زیاد بکە</h2>
        <form onSubmit={handleCreate} className="flex gap-3 flex-row-reverse flex-wrap">
          <button
            type="submit"
            disabled={createExpense.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            data-testid="button-add-expense"
          >
            <Plus size={16} />
            پاشەکەوتکردن
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            data-testid="input-expense-date"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(toEnglishDigits(e.target.value))}
            placeholder="بڕی پارە (د.ع)"
            className="flex-1 min-w-32 px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-end"
            data-testid="input-expense-amount"
            min={0}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex-1 min-w-40 px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-end"
            data-testid="select-expense-type"
          >
            <option value="">--- جۆری خەرجی ---</option>
            {EXPENSE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </form>
      </div>

      {/* Total */}
      {!isLoading && (expenses as Expense[] ?? []).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
          <span className="text-destructive font-bold">{total.toFixed(0)} د.ع</span>
          <span className="text-muted-foreground text-sm">کۆی گشتی</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">سڕینەوە</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">بڕ</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">جۆر</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">بەروار</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[0,1,2,3].map((j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : (expenses as Expense[] ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">هیچ خەرجیێک نییە</td></tr>
            ) : (expenses as Expense[] ?? []).map((e) => (
              <tr key={e.id} data-testid={`row-expense-${e.id}`} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <button onClick={() => setPendingDelete(e)} className="px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 text-xs font-medium" data-testid={`button-delete-expense-${e.id}`}>
                    <Trash2 size={14} />
                    <span>سڕینەوە</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-end text-destructive font-medium">{e.amount.toFixed(0)} د.ع</td>
                <td className="px-4 py-3 text-end text-foreground">{e.type}</td>
                <td className="px-4 py-3 text-end text-muted-foreground text-sm">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="سڕینەوەی خەرجی"
        message={`دڵنیایت لە سڕینەوەی خەرجی "${pendingDelete?.type ?? ""}" بە بڕی ${pendingDelete?.amount ?? 0} د.ع؟`}
        confirmText="بەڵێ، بسڕەوە"
        cancelText="پاشگەزبوونەوە"
        variant="danger"
        icon="trash"
        loading={deleteExpense.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
