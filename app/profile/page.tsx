"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import { supabase, type Student } from "@/lib/supabase";
import { useStudent } from "@/lib/useStudent";
import { Skeleton, useUI } from "@/components/UI";

const fields: { key: keyof Student; label: string; type?: string; area?: boolean }[] = [
  { key: "campus", label: "Campus" },
  { key: "instructor", label: "Internship Instructor" },
  { key: "company", label: "Name of Company" },
  { key: "job_description", label: "Job Description", area: true },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
  { key: "required_hours", label: "Required Hours", type: "number" },
];

export default function Profile() {
  const { student, setStudent } = useStudent();
  const [form, setForm] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useUI();

  useEffect(() => { if (student) setForm(student); }, [student]);

  const save = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const v = form[f.key];
      payload[f.key] = f.type === "number" ? Number(v) || 486 : v === "" ? null : v;
    }
    const { data, error } = await supabase.from("students").update(payload).eq("id", student!.id).select().single();
    setSaving(false);
    if (error) return toast(error.message, "error");
    setStudent(data as Student);
    toast("Profile saved");
  };

  return (
    <main className="pb-safe">
      <TopBar title="Profile" subtitle={student?.name} />
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        <p className="muted px-1 text-sm">These details fill in the header of your weekly report.</p>
        {!student ? (
          <section className="card space-y-4 p-5">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className={f.area ? "h-20" : "h-11"} /></div>
            ))}
            <Skeleton className="h-12" />
          </section>
        ) : (
        <section className="card space-y-4 p-5">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="muted mb-1 block text-xs font-semibold uppercase">{f.label}</span>
              {f.area ? (
                <textarea className="field min-h-20" value={(form[f.key] as string) || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              ) : (
                <input className="field" type={f.type || "text"} value={(form[f.key] as string | number) ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
          <button className="btn btn-blue w-full" onClick={save} disabled={!student || saving}>{saving ? "Saving…" : "Save"}</button>
        </section>
        )}
      </div>
      <TabBar />
    </main>
  );
}
