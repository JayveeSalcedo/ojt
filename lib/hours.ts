import type { Entry } from "./supabase";

/** Worked hours: span minus break (break only deducted for spans over 5h). */
export function computeHours(timeIn: string | null, timeOut: string | null, breakMinutes = 60) {
  if (!timeIn || !timeOut) return 0;
  const mins = (new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 60000;
  if (mins <= 0) return 0;
  const worked = mins > 300 ? mins - breakMinutes : mins;
  return Math.round((Math.max(0, worked) / 60) * 100) / 100;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return parseDate(iso).toLocaleDateString("en-US", opts);
}

export function fmtTime(ts: string | null) {
  return ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—";
}

export type Week = { number: number; start: string; end: string; entries: Entry[] };

/** Groups entries into 7-day weeks counted from startDate (or the first entry). */
export function groupWeeks(entries: Entry[], startDate: string | null): Week[] {
  if (!entries.length) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const origin = parseDate(startDate || sorted[0].date);
  const map = new Map<number, Week>();
  for (const e of sorted) {
    const diff = Math.floor((parseDate(e.date).getTime() - origin.getTime()) / 86400000);
    const n = Math.max(0, Math.floor(diff / 7)) + 1;
    if (!map.has(n)) {
      const s = new Date(origin.getTime() + (n - 1) * 7 * 86400000);
      const en = new Date(s.getTime() + 6 * 86400000);
      const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map.set(n, { number: n, start: iso(s), end: iso(en), entries: [] });
    }
    map.get(n)!.entries.push(e);
  }
  return [...map.values()].sort((a, b) => a.number - b.number);
}
