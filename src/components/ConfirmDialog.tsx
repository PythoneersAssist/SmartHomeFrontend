type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <section
      className="fixed inset-0 z-30 grid place-items-center px-4"
      style={{ background: 'rgba(10, 25, 41, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-cyan-200/20 p-6 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-extrabold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>

        <div className="mt-5 flex gap-2">
          <button
            className="rounded-xl bg-rose-500/90 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
          <button
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
