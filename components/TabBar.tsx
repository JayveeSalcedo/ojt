"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/today", label: "Today", d: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { href: "/gallery", label: "Gallery", d: "M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm5.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm12.5 5-5-5L5 21" },
  { href: "/journal", label: "Journal", d: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11M9 8h6" },
  { href: "/report", label: "Report", d: "M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6" },
  { href: "/profile", label: "Profile", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="glass sep no-print fixed inset-x-0 bottom-0 z-30 border-t" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex max-w-2xl">
        {tabs.map((t) => {
          const active = path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium ${active ? "text-brand-2" : "muted"}`}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={t.d} />
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
