import { useState, useEffect } from "react";
import { X, Check, Square, User, Clock, Coins } from "lucide-react";

interface EndSessionConfirmProps {
  open: boolean;
  courtName: string;
  customerName?: string | null;
  startedAt: string;
  hourlyRate: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndSessionConfirm({
  open, courtName, customerName, startedAt, hourlyRate, loading, onConfirm, onCancel,
}: EndSessionConfirmProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, startedAt]);

  if (!open) return null;

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const cost = (elapsed / 3600) * hourlyRate;
  const totalMinutes = Math.floor(elapsed / 60);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className="h-1.5 w-full bg-amber-500" />

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <button onClick={onCancel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            <X size={18} />
          </button>
          <h3 className="text-base font-bold text-foreground text-end flex items-center gap-2">
            <span>وەستاندنی یاری — {courtName}</span>
            <Square size={16} className="text-amber-400" />
          </h3>
        </div>

        <div className="p-5 space-y-3">
          {customerName && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
              <span className="text-foreground font-semibold text-end">{customerName}</span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <User size={14} />
                <span>ناوی کەس</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="text-end" dir="ltr">
              <div className="text-amber-300 font-mono text-2xl font-bold tracking-wider">
                {pad(h)}:{pad(m)}:{pad(s)}
              </div>
              <div className="text-amber-400/80 text-xs mt-0.5">{totalMinutes} خولەک</div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock size={14} />
              <span>کاتی یاری</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30">
            <div className="text-end">
              <div className="text-primary text-2xl font-bold">{cost.toFixed(0)} <span className="text-sm font-medium">د.ع</span></div>
              <div className="text-primary/70 text-xs mt-0.5">{Math.round(hourlyRate / 60)} د.ع نرخی خولەک</div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Coins size={14} />
              <span>کۆی پارە</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-muted/40 text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/60 transition-colors disabled:opacity-50"
            data-testid="button-cancel-end-session"
          >
            <X size={16} />
            <span>پاشگەزبوونەوە</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            data-testid="button-confirm-end-session"
          >
            <Check size={16} />
            <span>{loading ? "..." : "تەواو"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
