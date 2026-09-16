import InstallButton from "./InstallButton";

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <div className="glass sep no-print sticky top-0 z-30 border-b" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-7 w-7 rounded-[8px]" />
            <span className="text-[15px] font-semibold">OJT Tracker</span>
          </div>
          <InstallButton />
        </div>
      </div>
      <div className="no-print mx-auto max-w-2xl px-4 pt-4 pb-2">
        {subtitle && <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-2">{subtitle}</p>}
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
      </div>
    </>
  );
}
