import { useState, useEffect, useRef } from "react";
import { X, Check, Square, User, Clock, Coins, CheckCircle2 } from "lucide-react";

interface EndSessionConfirmProps {
  open: boolean;
  courtName: string;
  customerName?: string | null;
  startedAt: string;
  hourlyRate: number;
  loading?: boolean;
  done?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function EndSessionConfirm({
  open, courtName, customerName, startedAt, hourlyRate, loading, done,
  onConfirm, onCancel, onClose,
}: EndSessionConfirmProps) {
  const [elapsed, setElapsed] = useState(0);
  const frozenRef = useRef<number | null>(null);

  // While confirming → live tick. Once done → freeze the elapsed value.
  useEffect(() => {
    if (!open) {
      frozenRef.current = null;
      return;
    }
    if (done) {
      // Keep current value, no more ticking
      return;
    }
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, startedAt, done]);

  // Capture the exact value at the moment of completion
  useEffect(() => {
    if (done && frozenRef.current === null) {
      frozenRef.current = elapsed;
    }
  }, [done, elapsed]);

  if (!open) return null;

  const displayed = done && frozenRef.current !== null ? frozenRef.current : elapsed;
  const h = Math.floor(displayed / 3600);
  const m = Math.floor((displayed % 3600) / 60);
  const s = displayed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const cost = (displayed / 3600) * hourlyRate;
  const totalMinutes = Math.floor(displayed / 60);

  const handleBackdrop = () => {
    if (done) onClose();
    else if (!loading) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleBackdrop}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className={`h-1.5 w-full ${done ? "bg-primary" : "bg-amber-500"}`} />

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <button
            onClick={done ? onClose : onCancel}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
          <h3 className="text-base font-bold text-foreground text-end flex items-center gap-2">
            {done ? (
              <>
                <span>یاری تەواوبوو</span>
                <CheckCircle2 size={18} className="text-primary" />
              </>
            ) : (
              <>
                <span>وەستاندنی یاری</span>
                <Square size={16} className="text-amber-400" />
              </>
            )}
          </h3>
        </div>

        <div className="p-5 space-y-3">
          {/* Court name */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
            <span className="text-foreground font-bold text-end text-lg">{courtName}</span>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Square size={14} />
              <span>میز</span>
            </div>
          </div>

          {customerName && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-300 font-semibold text-end">{customerName}</span>
              <div className="flex items-center gap-1.5 text-amber-400/80 text-xs">
                <User size={14} />
                <span>ناوی کەس</span>
              </div>
            </div>
          )}

          {/* Duration */}
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

          {/* Cost */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30">
            <div className="text-end">
              <div className="text-primary text-2xl font-bold">
                {cost.toFixed(0)} <span className="text-sm font-medium">د.ع</span>
              </div>
              <div className="text-primary/70 text-xs mt-0.5">
                {Math.round(hourlyRate / 60)} د.ع نرخی خولەک
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Coins size={14} />
              <span>کۆی پارە</span>
            </div>
          </div>

          {done && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-end text-sm text-primary flex items-center justify-end gap-2">
              <span>یاری بەسەرکەوتوویی پاشەکەوت کرا</span>
              <CheckCircle2 size={16} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="col-span-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              data-testid="button-close-end-session"
            >
              <X size={16} />
              <span>داخستن</span>
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
