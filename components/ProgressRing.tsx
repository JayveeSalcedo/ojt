export default function ProgressRing({ value, total }: { value: number; total: number }) {
  const pct = Math.min(1, total ? value / total : 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E6FD9" />
            <stop offset="100%" stopColor="#FFC629" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(30,111,217,.14)" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="url(#ring)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{Math.round(pct * 100)}%</span>
        <span className="muted text-xs tabular-nums">{value.toFixed(1)} / {total} h</span>
      </div>
    </div>
  );
}
