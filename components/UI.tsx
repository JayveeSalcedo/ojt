"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

/* ---------- Skeleton ---------- */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

/* ---------- Toast + Confirm provider ---------- */
type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; text: string };
type ConfirmOpts = { title: string; message?: string; confirmText?: string; cancelText?: string; destructive?: boolean };

const Ctx = createContext<{
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
} | null>(null);

export function useUI() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI must be used inside UIProvider");
  return c;
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const toast = useCallback((text: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 4000 : 2500);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => {
    setDialog(opts);
    return new Promise<boolean>((resolve) => (resolver.current = resolve));
  }, []);

  const close = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setDialog(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)" }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast-in glass pointer-events-auto flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-4 text-[15px] font-medium shadow-lg">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white ${
                t.kind === "success" ? "bg-green-500" : t.kind === "error" ? "bg-red-500" : "bg-brand-2"
              }`}
            >
              {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}
            </span>
            {t.text}
          </div>
        ))}
      </div>

      {/* Confirm dialog (iOS alert style) */}
      {dialog && (
        <div className="no-print fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-8" onClick={() => close(false)}>
          <div className="pop-in glass w-full max-w-[290px] overflow-hidden rounded-2xl text-center" onClick={(e) => e.stopPropagation()} role="alertdialog">
            <div className="px-4 pt-5 pb-4">
              <h3 className="text-[17px] font-semibold">{dialog.title}</h3>
              {dialog.message && <p className="mt-1 text-[13px] leading-snug">{dialog.message}</p>}
            </div>
            <div className="sep grid grid-cols-2 border-t">
              <button className="sep border-r py-3 text-[17px] text-brand-2 active:bg-black/5" onClick={() => close(false)}>
                {dialog.cancelText || "Cancel"}
              </button>
              <button
                className={`py-3 text-[17px] font-semibold active:bg-black/5 ${dialog.destructive ? "text-red-500" : "text-brand-2"}`}
                onClick={() => close(true)}
                autoFocus
              >
                {dialog.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
