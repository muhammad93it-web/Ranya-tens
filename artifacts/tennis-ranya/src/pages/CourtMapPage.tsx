import { useState, useEffect, useRef } from "react";
import {
  useGetCourts,
  useCreateSession,
  useEndSession,
  useGetTimePresets,
  getGetCourtsQueryKey,
  getGetDashboardStatsQueryKey,
  getGetTimePresetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Play, Square, User, Clock, MapPin } from "lucide-react";
import { toEnglishDigits } from "@/lib/digits";

interface Court {
  id: number;
  name: string;
  hourlyRate: number;
  status: string;
  activeSessionId: number | null;
  activeSessionCustomerName: string | null;
  activeSessionStartedAt: string | null;
  activeSessionElapsedMinutes: number | null;
  activeSessionCurrentCost: number | null;
}

interface TimePreset {
  id: number;
  label: string;
  minutes: number;
}

function LiveTimer({ startedAt, hourlyRate }: { startedAt: string; hourlyRate: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const cost = (elapsed / 3600) * hourlyRate;

  return (
    <div className="text-center">
      <div className="text-sm font-mono font-bold text-amber-300 tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
      <div className="text-xs text-amber-400/80 mt-0.5">{cost.toFixed(0)} د.ع</div>
    </div>
  );
}

interface PanelProps {
  court: Court;
  presets: TimePreset[];
  onClose: () => void;
  onStart: (courtId: number, customerName: string, presetMinutes: number | null) => void;
  onEnd: (sessionId: number) => void;
  isStarting: boolean;
  isEnding: boolean;
}

function CourtPanel({ court, presets, onClose, onStart, onEnd, isStarting, isEnding }: PanelProps) {
  const [customerName, setCustomerName] = useState("");
  const [presetMinutes, setPresetMinutes] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const isActive = court.status === "active";
  const accentColor = isActive ? "amber" : "primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header stripe */}
        <div className={`h-1.5 w-full ${isActive ? "bg-amber-500" : "bg-primary"}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isActive ? "text-amber-400" : "text-foreground"}`}>{court.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"}`}>
              {isActive ? "گیراو" : "بەتاڵ"}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isActive ? (
            /* Active court — show info + stop */
            <>
              <div className={`rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center`}>
                {court.activeSessionCustomerName && (
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <User size={14} className="text-amber-400" />
                    <span className="text-amber-300 font-semibold text-sm">{court.activeSessionCustomerName}</span>
                  </div>
                )}
                {court.activeSessionStartedAt && (
                  <LiveTimer startedAt={court.activeSessionStartedAt} hourlyRate={court.hourlyRate} />
                )}
              </div>
              <button
                onClick={() => court.activeSessionId && onEnd(court.activeSessionId)}
                disabled={isEnding}
                className="w-full py-3 rounded-xl bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid={`panel-end-${court.id}`}
              >
                <Square size={16} />
                وەستاندنی مێز
              </button>
            </>
          ) : (
            /* Idle court — name + time picker + start */
            <>
              {/* Customer name */}
              <div>
                <label className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground mb-2">
                  <span>ناوی کەس (ئیجباری نییە)</span>
                  <User size={14} />
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(toEnglishDigits(e.target.value))}
                  placeholder="ناوی کەسەکە..."
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-end"
                  data-testid="input-customer-name"
                />
              </div>

              {/* Time presets */}
              <div>
                <label className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground mb-2">
                  <span>کاتی یاری (ئیجباری نییە)</span>
                  <Clock size={14} />
                </label>
                {presets.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-end py-2">هیچ کاتێک نییە — لە پەیجی کاتەکان زیاد بکە</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPresetMinutes(presetMinutes === p.minutes ? null : p.minutes)}
                        className={`px-2 py-2 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${
                          presetMinutes === p.minutes
                            ? "border-primary bg-primary/20 text-primary shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        data-testid={`preset-${p.minutes}`}
                      >
                        <span className="text-sm">{p.label}</span>
                        <span className="text-[10px] opacity-70">{p.minutes} خولەک</span>
                      </button>
                    ))}
                  </div>
                )}
                {presetMinutes && (
                  <p className="text-xs text-muted-foreground text-end mt-1.5">
                    نرخ: {((presetMinutes / 60) * court.hourlyRate).toFixed(0)} د.ع
                  </p>
                )}
              </div>

              <button
                onClick={() => onStart(court.id, customerName, presetMinutes)}
                disabled={isStarting}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                data-testid={`panel-start-${court.id}`}
              >
                <Play size={16} />
                دەستپێکردنی مێز
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TableShape({ court, onClick }: { court: Court; onClick: () => void }) {
  const isActive = court.status === "active";
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isActive) {
      const id = setInterval(() => setPulse((p) => !p), 1500);
      return () => clearInterval(id);
    }
    setPulse(false);
    return undefined;
  }, [isActive]);

  return (
    <button
      onClick={onClick}
      data-testid={`map-court-${court.id}`}
      className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer select-none
        ${isActive
          ? "border-amber-500/70 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:border-amber-400"
          : "border-border bg-card hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
        }`}
    >
      {/* Pulse ring for active */}
      {isActive && (
        <span
          className={`absolute inset-0 rounded-2xl border-2 border-amber-400 transition-all duration-1000 ${pulse ? "opacity-60 scale-105" : "opacity-0 scale-100"}`}
          style={{ borderRadius: "inherit" }}
        />
      )}

      {/* Court name */}
      <span className={`text-xs font-bold tracking-wide ${isActive ? "text-amber-400" : "text-muted-foreground group-hover:text-foreground"}`}>
        {court.name}
      </span>

      {/* Table visual — top-down ping pong table */}
      <div className={`relative w-16 h-11 rounded-md border-2 flex items-center justify-center transition-colors duration-300
        ${isActive ? "border-amber-500 bg-amber-500/20" : "border-muted-foreground/30 bg-muted/20 group-hover:border-primary/50 group-hover:bg-primary/10"}`}
      >
        {/* Net line */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-px ${isActive ? "bg-amber-400/60" : "bg-muted-foreground/40"}`} />
        {/* Center line */}
        <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px ${isActive ? "bg-amber-400/30" : "bg-muted-foreground/20"}`} />
        {/* Ball */}
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isActive ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "bg-muted-foreground/40 group-hover:bg-primary/60"}`} />
      </div>

      {/* Status content */}
      <div className="min-h-[36px] flex flex-col items-center justify-center">
        {isActive && court.activeSessionStartedAt ? (
          <LiveTimer startedAt={court.activeSessionStartedAt} hourlyRate={court.hourlyRate} />
        ) : (
          <span className="text-xs text-primary/60 group-hover:text-primary transition-colors">
            ▶ دەستپێبکە
          </span>
        )}
      </div>

      {/* Customer name badge */}
      {isActive && court.activeSessionCustomerName && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 max-w-full overflow-hidden">
          <User size={9} className="text-amber-400 shrink-0" />
          <span className="text-amber-300 text-xs truncate max-w-[60px]">{court.activeSessionCustomerName}</span>
        </div>
      )}
    </button>
  );
}

export default function CourtMapPage() {
  const queryClient = useQueryClient();
  const { data: courts, isLoading } = useGetCourts({
    query: { queryKey: getGetCourtsQueryKey(), refetchInterval: 4000 },
  });
  const { data: presetsData } = useGetTimePresets({
    query: { queryKey: getGetTimePresetsQueryKey() },
  });
  const createSession = useCreateSession();
  const endSession = useEndSession();
  const presets = (presetsData as TimePreset[] ?? []);

  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  function handleStart(courtId: number, customerName: string, presetMinutes: number | null) {
    createSession.mutate(
      { data: { courtId, customerName: customerName.trim() || null, presetMinutes } },
      {
        onSuccess: () => {
          setSelectedCourt(null);
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
          setSelectedCourt(null);
          queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      },
    );
  }

  const courtList = (courts as Court[] ?? []);
  const activeCourts = courtList.filter((c) => c.status === "active").length;
  const idleCourts = courtList.filter((c) => c.status === "idle").length;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            <span className="text-amber-400 text-sm font-medium">{activeCourts} گیراو</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-primary text-sm font-medium">{idleCourts} بەتاڵ</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>نەخشەی مێزەکان</span>
          <MapPin className="text-primary" size={22} />
        </h1>
      </div>

      {/* Map grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-40 bg-card border border-card-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {courtList.map((court) => (
            <TableShape
              key={court.id}
              court={court}
              onClick={() => setSelectedCourt(court)}
            />
          ))}
        </div>
      )}

      {/* Panel modal */}
      {selectedCourt && (
        <CourtPanel
          court={selectedCourt}
          presets={presets}
          onClose={() => setSelectedCourt(null)}
          onStart={handleStart}
          onEnd={handleEnd}
          isStarting={createSession.isPending}
          isEnding={endSession.isPending}
        />
      )}
    </div>
  );
}
