import { useMemo, useState } from "react";
import { useGetReportSummary, getGetReportSummaryQueryKey } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

interface Session {
  id: number;
  courtName: string;
  customerName?: string | null;
  startedAt: string;
  durationMinutes: number | null;
  totalCost: number | null;
  status: string;
}

interface Expense {
  id: number;
  title: string | null;
  type: string;
  amount: number;
  notes: string | null;
  date: string;
}

type Preset = "today" | "yesterday" | "month" | "nextMonth" | "all";

function localToday(): { yyyy: number; mm: number; dd: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  return {
    yyyy: parseInt(parts.find((p) => p.type === "year")!.value, 10),
    mm: parseInt(parts.find((p) => p.type === "month")!.value, 10) - 1,
    dd: parseInt(parts.find((p) => p.type === "day")!.value, 10),
  };
}

function computeRange(preset: Preset): { start: string; end: string } {
  const { yyyy, mm, dd } = localToday();
  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if (preset === "today") {
    const today = iso(new Date(yyyy, mm, dd));
    return { start: today, end: today };
  }
  if (preset === "yesterday") {
    const y = iso(new Date(yyyy, mm, dd - 1));
    return { start: y, end: y };
  }
  if (preset === "month") {
    const start = new Date(yyyy, mm, 1);
    const end = new Date(yyyy, mm + 1, 0);
    return { start: iso(start), end: iso(end) };
  }
  if (preset === "nextMonth") {
    const start = new Date(yyyy, mm + 1, 1);
    const end = new Date(yyyy, mm + 2, 0);
    return { start: iso(start), end: iso(end) };
  }
  // all: from the very beginning of records until today
  return { start: "2000-01-01", end: iso(new Date(yyyy, mm, dd)) };
}

export default function ReportsPage() {
  const { user } = useUser();
  const isCashier = user?.role === "cashier";

  const [preset, setPreset] = useState<Preset>("today");
  const todayRange = useMemo(() => computeRange("today"), []);

  const range = computeRange(preset);

  // Cashier locked to today
  const effective = isCashier ? todayRange : range;

  const { data, isLoading } = useGetReportSummary(
    { startDate: effective.start, endDate: effective.end },
    { query: { queryKey: getGetReportSummaryQueryKey({ startDate: effective.start, endDate: effective.end }) } },
  );

  function formatDuration(minutes: number | null) {
    if (minutes == null) return "---";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h > 0) return `${h} کات ${m} خولەک`;
    return `${m} خولەک`;
  }

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB");
    const time = d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${date} — ${time}`;
  }

  const presetBtns: { key: Preset; label: string }[] = [
    { key: "today", label: "ئەمڕۆ" },
    { key: "yesterday", label: "دوێنێ" },
    { key: "month", label: "ئەم مانگە" },
    { key: "nextMonth", label: "مانگی داهاتوو" },
    { key: "all", label: "هەمووی" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-start mb-6 flex items-center justify-start gap-2">
        <span>ڕاپۆرتەکان</span>
        <BarChart3 className="text-primary" size={22} />
      </h1>

      {/* Preset filter buttons */}
      {!isCashier && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            {presetBtns.map((b) => (
              <button
                key={b.key}
                onClick={() => setPreset(b.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  preset === b.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40 border border-border"
                }`}
                data-testid={`preset-${b.key}`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="text-start text-xs text-muted-foreground mt-3">
            {effective.start} → {effective.end}
          </div>
        </div>
      )}
      {isCashier && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-4 text-start text-sm text-muted-foreground">
          ڕاپۆرتی ئەمڕۆ • {effective.start}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">کۆی داهات</span>
          </div>
          <p className="text-2xl font-bold text-primary text-end">
            {isLoading ? "..." : `${(data?.totalIncome ?? 0).toFixed(0)} د.ع`}
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown size={20} className="text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">کۆی خەرجی</span>
          </div>
          <p className="text-2xl font-bold text-destructive text-end">
            {isLoading ? "..." : `${(data?.totalExpenses ?? 0).toFixed(0)} د.ع`}
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <DollarSign size={20} className="text-accent" />
            </div>
            <span className="text-xs text-muted-foreground">قازانجی پوختە</span>
          </div>
          <p className={`text-2xl font-bold text-end ${(data?.netProfit ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
            {isLoading ? "..." : `${(data?.netProfit ?? 0).toFixed(0)} د.ع`}
          </p>
        </div>
      </div>

      {/* Sessions table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-start gap-2">
          <h2 className="text-sm font-semibold text-foreground text-start">یارییەکانی تێپەڕوو</h2>
          <BarChart3 size={16} className="text-primary" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">بەروار و کات</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">میز</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">ناوی کەس</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">ماوە</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">کۆی نرخ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">چاوەڕوانبە...</td></tr>
            ) : (data?.sessions as Session[] ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">هیچ یاریێک نییە لەم بەرواردا</td></tr>
            ) : (data?.sessions as Session[] ?? []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 text-start text-muted-foreground text-sm">{formatDateTime(s.startedAt)}</td>
                <td className="px-4 py-3 text-start text-foreground">{s.courtName}</td>
                <td className="px-4 py-3 text-start">
                  {s.customerName ? (
                    <span className="text-amber-400 font-medium">{s.customerName}</span>
                  ) : (
                    <span className="text-muted-foreground/60 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-start text-foreground">{formatDuration(s.durationMinutes)}</td>
                <td className="px-4 py-3 text-start text-primary font-medium">{s.totalCost?.toFixed(0) ?? "---"} د.ع</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expenses table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-start gap-2">
          <h2 className="text-sm font-semibold text-foreground text-start">خەرجییەکان لەم ماوەیە</h2>
          <Receipt size={16} className="text-destructive" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">بەروار</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">ناونیشان</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">جۆر</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">بڕ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">چاوەڕوانبە...</td></tr>
            ) : (data?.expenses as Expense[] ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">هیچ خەرجیێک نییە</td></tr>
            ) : (data?.expenses as Expense[] ?? []).map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 text-start text-muted-foreground text-sm">{e.date}</td>
                <td className="px-4 py-3 text-start text-foreground">{e.title || "—"}</td>
                <td className="px-4 py-3 text-start text-foreground">{e.type}</td>
                <td className="px-4 py-3 text-start text-destructive font-medium">{e.amount.toFixed(0)} د.ع</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
