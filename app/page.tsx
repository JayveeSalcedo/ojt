"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { supabase, type Student } from "@/lib/supabase";
import { getStoredId, setStoredId } from "@/lib/useStudent";
import { Skeleton, useUI } from "@/components/UI";

export default function PickName() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, confirm } = useUI();

  useEffect(() => {
    if (getStoredId()) {
      router.replace("/today");
      return;
    }
    supabase
      .from("students")
      .select("id,name")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setStudents((data as Student[]) || []);
        setLoading(false);
      });
  }, [router]);

  const filtered = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())),
    [students, q]
  );

  const choose = async (s: Student) => {
    const ok = await confirm({ title: `Are you ${s.name}?`, message: "This device will stay signed in as this student.", confirmText: "Yes, it's me" });
    if (!ok) return;
    setStoredId(s.id);
    toast(`Welcome, ${s.name.split(",").pop()!.trim().split(" ")[0]}!`);
    router.replace("/today");
  };

  return (
    <main className="pb-10">
      <TopBar title="Who are you?" subtitle="Welcome" />
      <div className="mx-auto max-w-2xl px-4">
        <p className="muted mb-4 text-[15px]">Choose your name to start tracking your 486 OJT hours.</p>
        <input className="field mb-4" placeholder="Search name" value={q} onChange={(e) => setQ(e.target.value)} />
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <div className="card sep overflow-hidden">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i ? "sep border-t" : ""}`}>
                <Skeleton className="h-9 w-9 !rounded-full" />
                <div className="flex-1" style={{ maxWidth: `${50 + ((i * 37) % 40)}%` }}><Skeleton className="h-4" /></div>
              </div>
            ))}
          {!loading && !filtered.length && <p className="muted p-4">No names found.</p>}
          {filtered.map((s, i) => (
            <button
              key={s.id}
              onClick={() => choose(s)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-black/5 ${i ? "sep border-t" : ""}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-2 to-brand text-sm font-bold text-sun">
                {s.name.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 text-[16px]">{s.name}</span>
              <span className="muted">›</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
