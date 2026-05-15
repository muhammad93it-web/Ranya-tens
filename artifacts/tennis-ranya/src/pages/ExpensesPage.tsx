import { useEffect, useState } from "react";
import {
  useGetExpenses,
  useCreateExpense,
  useDeleteExpense,
  useGetExpenseTypes,
  useCreateExpenseType,
  useDeleteExpenseType,
  getGetExpensesQueryKey,
  getGetExpenseTypesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Receipt, X, Check, Tag } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toEnglishDigits } from "@/lib/digits";
import { useUser } from "@/contexts/UserContext";

interface Expense {
  id: number;
  title: string | null;
  type: string;
  amount: number;
  notes: string | null;
  date: string;
}

interface ExpenseType {
  id: number;
  label: string;
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isAdmin = user?.role === "admin";
  const today = (() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Baghdad",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")!.value;
    const m = parts.find((p) => p.type === "month")!.value;
    const d = parts.find((p) => p.type === "day")!.value;
    return `${y}-${m}-${d}`;
  })();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const [showTypesManager, setShowTypesManager] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [pendingDeleteType, setPendingDeleteType] = useState<ExpenseType | null>(null);

  const { data: expenses, isLoading } = useGetExpenses({}, { query: { queryKey: getGetExpensesQueryKey({}) } });
  const { data: expenseTypes } = useGetExpenseTypes({ query: { queryKey: getGetExpenseTypesQueryKey() } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createExpenseType = useCreateExpenseType();
  const deleteExpenseType = useDeleteExpenseType();

  const types = (expenseTypes as ExpenseType[]) ?? [];

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

  function closeForm() {
    setShowForm(false);
    setTitle("");
    setType("");
    setAmount("");
    setNotes("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !amount) return;
    createExpense.mutate(
      { data: { title: title || undefined, type, amount: Number(amount), notes: notes || undefined, date: today } },
      {
        onSuccess: () => {
          closeForm();
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

  function handleAddType(e: React.FormEvent) {
    e.preventDefault();
    const label = newTypeLabel.trim();
    if (!label) return;
    createExpenseType.mutate({ data: { label } }, {
      onSuccess: () => {
        setNewTypeLabel("");
        queryClient.invalidateQueries({ queryKey: getGetExpenseTypesQueryKey() });
      },
    });
  }

  function confirmDeleteType() {
    if (!pendingDeleteType) return;
    deleteExpenseType.mutate({ id: pendingDeleteType.id }, {
      onSuccess: () => {
        setPendingDeleteType(null);
        queryClient.invalidateQueries({ queryKey: getGetExpenseTypesQueryKey() });
      },
    });
  }

  const total = (expenses as Expense[] ?? []).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowTypesManager(true)}
              className="px-3.5 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors text-sm font-medium flex items-center gap-1.5"
              data-testid="button-manage-types"
            >
              <Tag size={15} />
              <span>جۆرەکان</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity text-sm"
            data-testid="button-open-add-expense"
          >
            <Plus size={16} />
            <span>زیادکردنی خەرجی</span>
          </button>
        </div>
        <h1 className="text-xl font-bold text-foreground text-end flex items-center justify-end gap-2">
          <span>خەرجییەکان</span>
          <Receipt className="text-primary" size={22} />
        </h1>
      </div>

      {/* Total card */}
      {!isLoading && (expenses as Expense[] ?? []).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
          <span className="text-destructive font-bold">{total.toFixed(0)} د.ع</span>
          <span className="text-muted-foreground text-sm">کۆی گشتی خەرجی</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">سڕینەوە</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">تێبینی</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">بڕ</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">جۆر</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">ناونیشان</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">بەروار</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[0,1,2,3,4,5].map((j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : (expenses as Expense[] ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">هیچ خەرجیێک نییە</td></tr>
            ) : (expenses as Expense[] ?? []).map((e) => (
              <tr key={e.id} data-testid={`row-expense-${e.id}`} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <button onClick={() => setPendingDelete(e)} className="px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 text-xs font-medium" data-testid={`button-delete-expense-${e.id}`}>
                    <Trash2 size={14} />
                    <span>سڕینەوە</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-end text-muted-foreground text-sm max-w-xs truncate">{e.notes || "—"}</td>
                <td className="px-4 py-3 text-end text-destructive font-medium">{e.amount.toFixed(0)} د.ع</td>
                <td className="px-4 py-3 text-end text-foreground">{e.type}</td>
                <td className="px-4 py-3 text-end text-foreground">{e.title || "—"}</td>
                <td className="px-4 py-3 text-end text-muted-foreground text-sm">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={closeForm}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
            className="relative w-full max-w-md bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="bg-destructive/90 px-5 py-3.5 text-end">
              <h3 className="text-base font-bold text-white">زیادکردنی خەرجی</h3>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground text-end mb-1.5">ناونیشانی خەرجی</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input focus:border-primary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-end"
                  data-testid="input-expense-title" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground text-end mb-1.5">جۆری خەرجی</label>
                <select value={type} onChange={(e) => setType(e.target.value)} required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input focus:border-primary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-end"
                  data-testid="select-expense-type">
                  <option value="">--- هەڵبژێرە ---</option>
                  {types.map((t) => <option key={t.id} value={t.label}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground text-end mb-1.5">بڕی پارە (د.ع)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(toEnglishDigits(e.target.value))} required min={0}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input focus:border-primary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-end"
                  data-testid="input-expense-amount" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground text-end mb-1.5">تێبینی (لەختیاری)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input focus:border-primary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-end resize-none"
                  data-testid="input-expense-notes" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <X size={16} />
                  <span>پاشگەزبوونەوە</span>
                </button>
                <button type="submit" disabled={createExpense.isPending || !type || !amount}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  data-testid="button-save-expense">
                  <Check size={16} />
                  <span>{createExpense.isPending ? "..." : "پاشەکەوتکردن"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Types manager modal */}
      {showTypesManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setShowTypesManager(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
            className="relative w-full max-w-md bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary/90 px-5 py-3.5 flex items-center justify-between">
              <button onClick={() => setShowTypesManager(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
              <h3 className="text-base font-bold text-white text-end">جۆرەکانی خەرجی</h3>
            </div>
            <div className="p-5 space-y-4">
              <form onSubmit={handleAddType} className="flex gap-2 flex-row-reverse">
                <input type="text" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)}
                  placeholder="جۆری نوێ"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input focus:border-primary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-end"
                  data-testid="input-new-type" />
                <button type="submit" disabled={!newTypeLabel.trim() || createExpenseType.isPending}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50">
                  <Plus size={16} />
                  <span>زیادکردن</span>
                </button>
              </form>
              <div className="max-h-80 overflow-y-auto space-y-1.5">
                {types.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">هیچ جۆرێک نییە</p>
                ) : types.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/20 border border-border">
                    <button onClick={() => setPendingDeleteType(t)}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                      data-testid={`button-delete-type-${t.id}`}>
                      <Trash2 size={14} />
                    </button>
                    <span className="text-end text-foreground">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="سڕینەوەی خەرجی"
        message={`دڵنیایت لە سڕینەوەی خەرجی "${pendingDelete?.title ?? pendingDelete?.type ?? ""}" بە بڕی ${pendingDelete?.amount ?? 0} د.ع؟`}
        confirmText="بەڵێ، بسڕەوە"
        cancelText="پاشگەزبوونەوە"
        variant="danger"
        icon="trash"
        loading={deleteExpense.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={!!pendingDeleteType}
        title="سڕینەوەی جۆر"
        message={`دڵنیایت لە سڕینەوەی جۆری "${pendingDeleteType?.label ?? ""}"؟`}
        confirmText="بەڵێ، بسڕەوە"
        cancelText="پاشگەزبوونەوە"
        variant="danger"
        icon="trash"
        loading={deleteExpenseType.isPending}
        onConfirm={confirmDeleteType}
        onCancel={() => setPendingDeleteType(null)}
      />
    </div>
  );
}
