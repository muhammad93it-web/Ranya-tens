import { useEffect, useRef } from "react";
import {
  useGetWinners,
  useCreateWinner,
  useUpdateWinner,
  useDeleteWinner,
  getGetWinnersQueryKey,
  type Winner,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, Plus, Minus, Trash2, Check } from "lucide-react";
import { toEnglishDigits } from "@/lib/digits";

type EditableFields = Partial<Pick<Winner, "name" | "sets" | "amount" | "counted">>;

export default function WinnersPage() {
  const queryClient = useQueryClient();
  const { data } = useGetWinners({ query: { queryKey: getGetWinnersQueryKey() } });
  const createWinner = useCreateWinner();
  const updateWinner = useUpdateWinner();
  const deleteWinner = useDeleteWinner();

  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<number, EditableFields>>({});

  const rows = data ?? [];

  function patchCache(id: number, partial: EditableFields) {
    queryClient.setQueryData<Winner[]>(getGetWinnersQueryKey(), (old) =>
      old ? old.map((w) => (w.id === id ? { ...w, ...partial } : w)) : old,
    );
  }

  function flushSave(id: number) {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    const edits = pending.current[id];
    if (edits && Object.keys(edits).length > 0) {
      updateWinner.mutate({ id, data: edits });
      delete pending.current[id];
    }
  }

  // Debounced save (text/amount): updates UI immediately, persists after a pause.
  function scheduleSave(id: number, partial: EditableFields) {
    patchCache(id, partial);
    pending.current[id] = { ...pending.current[id], ...partial };
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => flushSave(id), 600);
  }

  // Immediate save (buttons/checkbox): also flushes any pending text edits for the row.
  function saveImmediate(id: number, partial: EditableFields) {
    patchCache(id, partial);
    pending.current[id] = { ...pending.current[id], ...partial };
    flushSave(id);
  }

  // Persist any in-flight edits when leaving the page.
  useEffect(() => {
    const t = timers.current;
    return () => {
      Object.keys(t).forEach((k) => flushSave(Number(k)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addRow() {
    createWinner.mutate(
      { data: { name: "", sets: 0, amount: 0, counted: false } },
      {
        onSuccess: (created) => {
          queryClient.setQueryData<Winner[]>(getGetWinnersQueryKey(), (old) =>
            old ? [...old, created] : [created],
          );
        },
      },
    );
  }

  function removeRow(id: number) {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    delete pending.current[id];
    queryClient.setQueryData<Winner[]>(getGetWinnersQueryKey(), (old) =>
      old ? old.filter((w) => w.id !== id) : old,
    );
    deleteWinner.mutate({ id });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          disabled={createWinner.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          data-testid="button-add-winner"
        >
          <Plus size={16} />
          <span>زیادکردنی ڕیز</span>
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">بەشی فایزەکان</h1>
          <Award className="text-primary" size={22} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-start leading-relaxed">
        تا سەحی سەوز لێ نەدەیت، پارەی ئەو ڕیزە نایەتە ناو حیسابی داهات و ڕاپۆرتەکان. زانیارییەکان (ناو، سێت و پارە) خۆیان پاشەکەوت دەبن، تەنانەت ئەگەر سەحیشت لێ نەدا.
      </p>

      <section className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-muted-foreground">
              <th className="px-4 py-3 text-start font-medium w-12">#</th>
              <th className="px-4 py-3 text-start font-medium">ناو</th>
              <th className="px-4 py-3 text-center font-medium w-40">سێت</th>
              <th className="px-4 py-3 text-center font-medium w-36">پارە</th>
              <th className="px-4 py-3 text-center font-medium w-20">حیساب</th>
              <th className="px-4 py-3 text-center font-medium w-14"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 hover:bg-muted/10 ${
                  row.counted ? "bg-emerald-500/5" : ""
                }`}
                data-testid={`row-winner-${row.id}`}
              >
                <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.name ?? ""}
                    onChange={(e) => scheduleSave(row.id, { name: e.target.value })}
                    placeholder="ناو..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-start focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid={`input-name-${row.id}`}
                  />
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveImmediate(row.id, { sets: row.sets + 1 })}
                      className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:opacity-90"
                      data-testid={`button-inc-${row.id}`}
                    >
                      <Plus size={14} />
                    </button>
                    <span className="w-8 text-center font-mono font-semibold text-foreground">
                      {row.sets}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveImmediate(row.id, { sets: Math.max(0, row.sets - 1) })}
                      className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:opacity-90"
                      data-testid={`button-dec-${row.id}`}
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                </td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.amount ? row.amount.toLocaleString("en-US") : ""}
                    onChange={(e) => {
                      const n = parseInt(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""), 10);
                      const amount = Number.isNaN(n) ? 0 : n;
                      scheduleSave(row.id, { amount });
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid={`input-amount-${row.id}`}
                  />
                </td>

                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => saveImmediate(row.id, { counted: !row.counted })}
                    title={row.counted ? "پارە حیساب کراوە — کلیک بکە بۆ لابردن" : "کلیک بکە بۆ خستنە ناو حیسابی داهات"}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors mx-auto ${
                      row.counted
                        ? "bg-emerald-500 text-white"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                    data-testid={`button-check-${row.id}`}
                  >
                    <Check size={16} />
                  </button>
                </td>

                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center mx-auto"
                    data-testid={`button-remove-${row.id}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  هیچ ڕیزێک نییە — «زیادکردنی ڕیز» کلیک بکە
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
