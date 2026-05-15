import { useState, useEffect } from "react";
import { useGetCourts, useGetDashboardStats, useCreateSession, useEndSession, getGetCourtsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Square, Trophy, Clock } from "lucide-react";

interface Court {
  id: number;
  name: string;
  hourlyRate: number;
  status: string;
  activeSessionId: number | null;
  activeSessionStartedAt: string | null;
  activeSessionElapsedMinutes: number | null;
  activeSessionCurrentCost: number | null;
}

function CourtTimer({ startedAt, hourlyRate }: { startedAt: string; hourlyRate: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const cost = (elapsed / 3600) * hourlyRate;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="text-center">
      <div className="text-xl font-mono font-bold text-amber-400 tracking-wider">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </div>
      <div className="text-primary text-sm font-semibold mt-1">
        {cost.toFixed(0)} د.ع
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: courts, isLoading } = useGetCourts({
    query: { queryKey: getGetCourtsQueryKey(), refetchInterval: 5000 },
  });
  const { data: stats } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 5000 },
  });

  const createSession = useCreateSession();
  const endSession = useEndSession();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  function handleStart(courtId: number) {
    createSession.mutate(
      { data: { courtId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      },
    );
  }

  function handleEnd(sessionId: number) {
    endSession.mutate(
      { id: sessionId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      },
    );
  }

  const timeString = now.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateString = now.toLocaleDateString("ku", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock size={16} />
          <span>{timeString}</span>
          <span className="mx-1">|</span>
          <span>{dateString}</span>
        </div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-primary" />
          میزەکان
        </h1>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-lg font-bold">د.ع</span>
          </div>
          <div className="text-end">
            <p className="text-muted-foreground text-xs mb-1">کۆی پارەی ئەمڕۆ</p>
            <p className="text-primary text-xl font-bold">{(stats?.todayIncome ?? 0).toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
            {stats?.totalIdleCourts ?? 0}
          </div>
          <div className="text-end">
            <p className="text-muted-foreground text-xs mb-1">میزی بەتاڵ</p>
            <p className="text-amber-400 text-xl font-bold">{stats?.totalIdleCourts ?? 0}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
            {stats?.totalActiveCourts ?? 0}
          </div>
          <div className="text-end">
            <p className="text-muted-foreground text-xs mb-1">میزی گیراو</p>
            <p className="text-accent text-xl font-bold">{stats?.totalActiveCourts ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Courts grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-4 animate-pulse h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(courts as Court[] ?? []).map((court) => (
            <div
              key={court.id}
              data-testid={`card-court-${court.id}`}
              className={`bg-card border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
                court.status === "active"
                  ? "border-amber-500/50"
                  : "border-card-border"
              }`}
            >
              {/* Court header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    court.status === "active"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  {court.status === "active" ? "گیراو" : "بەتاڵ"}
                </span>
                <span className="text-sm font-bold text-foreground">{court.name}</span>
              </div>

              {/* Tennis table icon */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`w-20 h-14 rounded-lg border-2 relative flex items-center justify-center ${
                  court.status === "active"
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-primary/40 bg-primary/5"
                }`}>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-current opacity-30" />
                  <div className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-px bg-current opacity-30" />
                  <span className="text-2xl">🏓</span>
                </div>
              </div>

              {/* Timer or idle */}
              <div className="text-center">
                {court.status === "active" && court.activeSessionStartedAt ? (
                  <CourtTimer
                    startedAt={court.activeSessionStartedAt}
                    hourlyRate={court.hourlyRate}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">دەستپێکردن</div>
                )}
              </div>

              {/* Rate */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{court.hourlyRate} د.ع</span>
                <span>نرخ خولەک</span>
              </div>

              {/* Action button */}
              {court.status === "active" && court.activeSessionId ? (
                <button
                  onClick={() => handleEnd(court.activeSessionId!)}
                  disabled={endSession.isPending}
                  className="w-full py-2 rounded-lg bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                  data-testid={`button-end-${court.id}`}
                >
                  <Square size={14} />
                  وەستاندن
                </button>
              ) : (
                <button
                  onClick={() => handleStart(court.id)}
                  disabled={createSession.isPending}
                  className="w-full py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                  data-testid={`button-start-${court.id}`}
                >
                  <Play size={14} />
                  دەستپێکردن
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
