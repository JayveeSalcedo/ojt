"use client";
import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import ProgressRing from "@/components/ProgressRing";
import EntryEditor, { EntrySkeleton } from "@/components/EntryEditor";
import { supabase } from "@/lib/supabase";
import { useStudent } from "@/lib/useStudent";
import { fmtDate, todayISO, estimateEndDate } from "@/lib/hours";
import { Skeleton } from "@/components/UI";

export default function Today() {
  const { student } = useStudent();
  const [total, setTotal] = useState<number | null>(null);
  const date = todayISO();

  const loadTotal = useCallback(async () => {
    if (!student) return;
    const { data } = await supabase.from("entries").select("hours").eq("student_id", student.id);
    setTotal(((data as { hours: number }[]) || []).reduce((s, r) => s + Number(r.hours || 0), 0));
  }, [student]);

  useEffect(() => { loadTotal(); }, [loadTotal]);

  return (
    <main className="pb-safe">
      <TopBar title="Today" subtitle={fmtDate(date, { weekday: "long", month: "long", day: "numeric" })} />
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        {student && total !== null ? (
          <section className="card flex items-center gap-5 p-5">
            <ProgressRing value={total} total={student.required_hours} />
            <div className="space-y-2">
              <p className="text-[15px] font-semibold">{student.name}</p>
              <div><p className="muted text-xs uppercase">Rendered</p><p className="text-2xl font-bold tabular-nums">{total.toFixed(2)} h</p></div>
              <div><p className="muted text-xs uppercase">Remaining</p><p className="text-lg font-semibold tabular-nums text-brand-2">{Math.max(0, student.required_hours - total).toFixed(2)} h</p></div>
              {student.required_hours - total > 0 && (
                <div><p className="muted text-xs uppercase">Est. End Date</p><p className="text-[15px] font-semibold tabular-nums">{estimateEndDate(student.required_hours - total).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
              )}
            </div>
          </section>
        ) : (
          <section className="card flex items-center gap-5 p-5">
            <Skeleton className="h-36 w-36 !rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-24" />
            </div>
          </section>
        )}

        {student ? <EntryEditor student={student} date={date} mode="today" onChange={loadTotal} /> : <EntrySkeleton />}
      </div>
      <TabBar />
    </main>
  );
}
