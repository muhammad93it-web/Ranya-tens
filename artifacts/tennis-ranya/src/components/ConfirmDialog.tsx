import { useEffect } from "react";
import { AlertTriangle, LogOut, X } from "lucide-react";

export type ConfirmVariant = "danger" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: "trash" | "logout" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "بەڵێ، دڵنیام",
  cancelText = "پاشگەزبوونەوە",
  variant = "danger",
  icon = "warning",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const accentBg = variant === "danger" ? "bg-destructive" : "bg-amber-500";
  const accentText = variant === "danger" ? "text-destructive" : "text-amber-400";
  const accentRing = variant === "danger" ? "bg-destructive/15 ring-destructive/30" : "bg-amber-500/15 ring-amber-500/30";
  const confirmBtn = variant === "danger"
    ? "bg-destructive text-destructive-foreground hover:opacity-90 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
    : "bg-amber-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(251,191,36,0.3)]";

  const IconCmp = icon === "logout" ? LogOut : AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
      data-testid="confirm-dialog"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        {/* Top accent stripe */}
        <div className={`h-1 ${accentBg}`} />

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 start-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label="داخستن"
        >
          <X size={18} />
        </button>

        <div className="p-7 pt-8 text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full ${accentRing} ring-8 flex items-center justify-center mb-5`}>
            <IconCmp className={accentText} size={28} />
          </div>

          {/* Title */}
          <h3 id="confirm-title" className="text-lg font-bold text-foreground mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-7">{message}</p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium hover:bg-muted/40 transition-colors disabled:opacity-50"
              data-testid="confirm-cancel"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 ${confirmBtn}`}
              data-testid="confirm-ok"
            >
              {loading ? "..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
