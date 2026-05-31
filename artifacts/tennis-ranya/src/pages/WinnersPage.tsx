import { useState } from "react";
import { Award, Plus, Minus, Trash2, Check } from "lucide-react";
import { toEnglishDigits } from "@/lib/digits";

interface WinnerRow {
  id: number;
  name: string;
  count: number;
  price: number;
  checked: boolean;
}

let nextId = 1;

function makeEmptyRow(): WinnerRow {
  return { id: nextId++, name: "", count: 0, price: 0, checked: false };
}

export default function WinnersPage() {
  const [rows, setRows] = useState<WinnerRow[]>(() =>
    Array.from({ length: 5 }, () => makeEmptyRow()),
  );

  function patch(id: number, partial: Partial<WinnerRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...partial } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeEmptyRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90"
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

      <section className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-muted-foreground">
              <th className="px-4 py-3 text-start font-medium w-12">#</th>
              <th className="px-4 py-3 text-start font-medium">ناو</th>
              <th className="px-4 py-3 text-center font-medium w-40">سنت</th>
              <th className="px-4 py-3 text-center font-medium w-32">بایە</th>
              <th className="px-4 py-3 text-center font-medium w-20"></th>
              <th className="px-4 py-3 text-center font-medium w-14"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-muted/10"
                data-testid={`row-winner-${row.id}`}
              >
                <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => patch(row.id, { name: e.target.value })}
                    placeholder="ناو..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-start focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid={`input-name-${row.id}`}
                  />
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => patch(row.id, { count: row.count + 1 })}
                      className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:opacity-90"
                      data-testid={`button-inc-${row.id}`}
                    >
                      <Plus size={14} />
                    </button>
                    <span className="w-8 text-center font-mono font-semibold text-foreground">
                      {row.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => patch(row.id, { count: Math.max(0, row.count - 1) })}
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
                    value={row.price ? row.price.toLocaleString("en-US") : ""}
                    onChange={(e) => {
                      const n = parseInt(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""), 10);
                      patch(row.id, { price: Number.isNaN(n) ? 0 : n });
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid={`input-price-${row.id}`}
                  />
                </td>

                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => patch(row.id, { checked: !row.checked })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors mx-auto ${
                      row.checked
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
