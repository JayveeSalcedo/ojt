"use client";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import ReportTemplate, { type ReportRow } from "@/components/ReportTemplate";
import { supabase, type Entry } from "@/lib/supabase";
import { useStudent } from "@/lib/useStudent";
import { fmtDate, groupWeeks, type Week } from "@/lib/hours";
import { Skeleton, useUI } from "@/components/UI";

const coverage = (w: Week) =>
  `${fmtDate(w.start, { month: "short", day: "numeric" })} – ${fmtDate(w.end, { month: "short", day: "numeric", year: "numeric" })}`;

export default function Report() {
  const { student } = useStudent();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [first, setFirst] = useState(1);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [edited, setEdited] = useState(false);
  const { toast, confirm } = useUI();

  useEffect(() => {
    if (!student) return;
    supabase
      .from("entries")
      .select("*")
      .eq("student_id", student.id)
      .order("date")
      .then(({ data }) => { setEntries((data as Entry[]) || []); setLoaded(true); });
  }, [student]);

  const weeks = useMemo(() => groupWeeks(entries, student?.start_date ?? null), [entries, student]);
  const chosen = weeks.filter((w) => w.number >= first && w.number < first + 4);
  const hours = chosen.reduce((s, w) => s + w.entries.reduce((t, e) => t + Number(e.hours || 0), 0), 0);

  const generate = async () => {
    if (rows && edited) {
      const ok = await confirm({ title: "Regenerate Report?", message: "Your manual edits to the report will be replaced.", confirmText: "Regenerate", destructive: true });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const out = await Promise.all(
        chosen.map(async (w): Promise<ReportRow> => {
          const days = w.entries
            .filter((e) => e.narrative_ai || e.narrative_raw)
            .map((e) => ({ date: e.date, hours: Number(e.hours), narrative: (e.narrative_ai || e.narrative_raw)! }));
          const base = { label: `Week ${w.number}`, coverage: coverage(w) };
          if (!days.length) return { ...base, tasks: "", learnings: "" };
          const res = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ days }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return { ...base, tasks: data.tasks, learnings: data.learnings };
        })
      );
      setRows(out);
      setEdited(false);
      toast("Template filled. Review and print when ready.");
      setTimeout(() => document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setBusy(false);
  };

  const edit = (i: number, field: "tasks" | "learnings", value: string) => {
    setEdited(true);
    setRows((r) => r && r.map((row, k) => (k === i ? { ...row, [field]: value } : row)));
  };

  const pickWeeks = async (n: number) => {
    if (n === first) return;
    if (rows) {
      const ok = await confirm({ title: "Change Weeks?", message: "The current filled report will be cleared.", confirmText: "Change", destructive: true });
      if (!ok) return;
    }
    setFirst(n);
    setRows(null);
  };

  const missingProfile = student && (!student.company || !student.instructor || !student.campus);

  return (
    <main className="pb-safe">
      <TopBar title="Weekly Report" subtitle={student?.name} />
      <div className="no-print mx-auto max-w-2xl space-y-4 px-4">
        {missingProfile && (
          <a href="/profile" className="card block border-l-4 border-sun p-4 text-sm">
            Complete your <b>Profile</b> (campus, instructor, company) so the report header fills in. ›
          </a>
        )}
        <section className="card p-5">
          <h2 className="mb-1 text-lg font-semibold">Choose weeks</h2>
          <p className="muted mb-3 text-sm">Each report covers 4 weeks.</p>
          {!loaded ? (
            <div className="space-y-3">
              <div className="flex gap-2"><Skeleton className="h-9 w-28 !rounded-full" /><Skeleton className="h-9 w-28 !rounded-full" /></div>
              <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-4/6" />
            </div>
          ) : weeks.length ? (
            <div className="flex flex-wrap gap-2">
              {weeks.filter((w) => (w.number - 1) % 4 === 0).map((w) => {
                const active = first === w.number;
                return (
                  <button
                    key={w.number}
                    onClick={() => pickWeeks(w.number)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-brand-2 text-white" : "bg-brand-2/10 text-brand-2"}`}
                  >
                    Weeks {w.number}–{w.number + 3}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="muted text-sm">No entries yet. Log some days first.</p>
          )}
          {chosen.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {chosen.map((w) => (
                <li key={w.number} className="flex justify-between">
                  <span>Week {w.number} <span className="muted">· {coverage(w)}</span></span>
                  <span className="tabular-nums">{w.entries.length} days</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn btn-blue" disabled={!chosen.length || busy} onClick={generate}>
              {busy ? "Filling…" : rows ? "↻ Regenerate" : "✨ Fill Template"}
            </button>
            <button className="btn btn-sun" disabled={!rows} onClick={() => window.print()}>Print / Save PDF</button>
          </div>
          {rows && <p className="muted mt-3 text-xs">Tip: tap any cell in the report below to edit it before printing.</p>}
        </section>
      </div>

      {rows && student && (
        <div id="report-preview" className="mt-4 overflow-x-auto px-2 print:mt-0 print:px-0">
          <ReportTemplate student={student} hours={hours} rows={rows} onEdit={edit} />
        </div>
      )}
      {busy && !rows && (
        <div className="no-print mx-auto mt-4 max-w-2xl px-4">
          <div className="card space-y-3 p-5">
            <Skeleton className="h-5 w-1/2" />
            {chosen.map((w) => (
              <div key={w.number} className="grid grid-cols-[1fr_2fr_2fr] gap-2"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
            ))}
          </div>
        </div>
      )}
      <TabBar />
    </main>
  );
}
