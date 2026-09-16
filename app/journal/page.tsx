"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import EntryEditor from "@/components/EntryEditor";
import { supabase, photoUrl, type Entry, type Photo } from "@/lib/supabase";
import { useStudent } from "@/lib/useStudent";
import { fmtDate, fmtTime, groupWeeks, todayISO } from "@/lib/hours";
import { Skeleton } from "@/components/UI";

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Journal() {
  const { student } = useStudent();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pastDate, setPastDate] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!student) return;
    const { data } = await supabase.from("entries").select("*").eq("student_id", student.id).order("date", { ascending: false });
    const list = (data as Entry[]) || [];
    setEntries(list);
    const map: Record<string, Photo[]> = {};
    if (list.length) {
      const { data: ph } = await supabase.from("photos").select("*").in("entry_id", list.map((e) => e.id));
      for (const p of (ph as Photo[]) || []) (map[p.entry_id] ||= []).push(p);
    }
    setPhotos(map);
    setLoading(false);
  }, [student]);

  useEffect(() => { load(); }, [load]);

  // Lock background scroll while the sheet is open
  useEffect(() => {
    document.body.style.overflow = editing ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [editing]);

  const closeEditor = () => { setEditing(null); setPastDate(""); load(); };

  const weeks = groupWeeks(entries, student?.start_date ?? null).reverse();
  const today = todayISO();

  return (
    <main className="pb-safe">
      <TopBar title="Journal" subtitle={student?.name} />
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <section className="card p-4">
          <p className="font-semibold">Log a past day</p>
          <p className="muted text-sm">Catch up on days from before you started using the app.</p>
          <div className="mt-3 flex gap-2">
            <input type="date" className="field min-w-0 flex-1 !py-2" max={yesterdayISO()} value={pastDate} onChange={(e) => setPastDate(e.target.value)} />
            <button className="btn btn-blue shrink-0 !py-2" disabled={!pastDate || !student} onClick={() => setEditing(pastDate)}>
              Log Day
            </button>
          </div>
        </section>

        {loading &&
          [0, 1].map((k) => (
            <section key={k}>
              <Skeleton className="mb-2 ml-1 h-3 w-48" />
              <div className="card overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i ? "sep border-t" : ""}`}>
                    <Skeleton className="h-11 w-11 !rounded-xl" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-4/5" /></div>
                    <Skeleton className="h-5 w-10 !rounded-full" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        {!loading && !entries.length && (
          <div className="card p-6 text-center">
            <p className="text-lg font-semibold">No entries yet</p>
            <p className="muted mt-1 text-sm">Your daily logs will appear here.</p>
          </div>
        )}
        {weeks.map((w) => {
          const hrs = w.entries.reduce((s, e) => s + Number(e.hours || 0), 0);
          return (
            <section key={w.number}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="muted text-[13px] font-semibold uppercase tracking-wide">
                  Week {w.number} · {fmtDate(w.start, { month: "short", day: "numeric" })} – {fmtDate(w.end, { month: "short", day: "numeric" })}
                </h2>
                <span className="text-[13px] font-semibold tabular-nums text-brand-2">{hrs.toFixed(2)} h</span>
              </div>
              <div className="card overflow-hidden">
                {[...w.entries].reverse().map((e, i) => {
                  const ps = photos[e.id] || [];
                  const isOpen = open === e.id;
                  return (
                    <div key={e.id} className={i ? "sep border-t" : ""}>
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : e.id)}>
                        <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-brand-2/10 leading-none">
                          <span className="text-[10px] font-semibold uppercase text-brand-2">{fmtDate(e.date, { month: "short" })}</span>
                          <span className="text-lg font-bold">{fmtDate(e.date, { day: "numeric" })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{fmtDate(e.date, { weekday: "long" })}</p>
                          <p className="muted truncate text-sm">{e.narrative_ai || e.narrative_raw || "No narrative"}</p>
                        </div>
                        <span className="rounded-full bg-sun/30 px-2 py-0.5 text-xs font-semibold tabular-nums">{Number(e.hours).toFixed(1)}h</span>
                      </button>
                      {isOpen && (
                        <div className="space-y-3 px-4 pb-4">
                          <p className="muted text-sm">{fmtTime(e.time_in)} – {fmtTime(e.time_out)}</p>
                          {ps.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                              {ps.map((p) => <img key={p.id} src={photoUrl(p.storage_path)} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />)}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{e.narrative_ai || e.narrative_raw}</p>
                          {e.date === today ? (
                            <Link href="/today" className="btn btn-ghost block text-center">Open in Today</Link>
                          ) : (
                            <button className="btn btn-ghost w-full" onClick={() => setEditing(e.date)}>Edit Entry</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Past-day editor sheet */}
      {editing && student && (
        <div className="no-print fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={closeEditor}>
          <div
            className="sheet-up flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[22px]"
            style={{ background: "var(--bg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass sep flex items-center justify-between border-b px-4 py-3">
              <div className="w-16" />
              <div className="text-center">
                <p className="text-[15px] font-semibold">{fmtDate(editing, { weekday: "long" })}</p>
                <p className="muted text-xs">{fmtDate(editing, { month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
              <button className="w-16 text-right text-[16px] font-semibold text-brand-2" onClick={closeEditor}>Done</button>
            </div>
            <div className="overflow-y-auto p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
              <EntryEditor student={student} date={editing} mode="past" />
            </div>
          </div>
        </div>
      )}
      <TabBar />
    </main>
  );
}
