import { useState } from "react";
import { useGetReportSummary, getGetReportSummaryQueryKey } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Session {
  id: number;
  courtName: string;
  startedAt: string;
  durationMinutes: number | null;
  totalCost: number | null;
  status: string;
}

interface Expense {
  id: number;
  type: string;
  amount: number;
  date: string;
}

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useGetReportSummary({
    startDate,
    endDate,
  }, {
    query: {
      queryKey: getGetReportSummaryQueryKey({ startDate, endDate }),
    },
  });

  function formatDuration(minutes: number | null) {
    if (minutes == null) return "---";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h > 0) return `${h} کات ${m} خولەک`;
    return `${m} خولەک`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ku", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>ڕاپۆرتەکان</span>
        <BarChart3 className="text-primary" size={22} />
      </h1>

      {/* Date filter */}
      <div className="bg-card border border-card-border rounded-2xl p-5 mb-6">
        <div className="flex gap-4 items-end flex-row-reverse">
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground text-end mb-1">بەرواری دەستپێک</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" data-testid="input-start-date" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground text-end mb-1">بەرواری کۆتایی</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" data-testid="input-end-date" />
          </div>
        </div>
      </div>

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
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground text-end">یارییەکانی تێپەڕوو</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">کۆی نرخ</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">کات</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">میز</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">بەروار</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">چاوەڕوانبە...</td></tr>
            ) : (data?.sessions as Session[] ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">هیچ یاریێک نییە لەم بەرواردا</td></tr>
            ) : (data?.sessions as Session[] ?? []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 text-end text-primary font-medium">{s.totalCost?.toFixed(0) ?? "---"} د.ع</td>
                <td className="px-4 py-3 text-end text-foreground">{formatDuration(s.durationMinutes)}</td>
                <td className="px-4 py-3 text-end text-foreground">{s.courtName}</td>
                <td className="px-4 py-3 text-end text-muted-foreground text-sm">{formatDate(s.startedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
