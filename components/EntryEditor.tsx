"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, photoUrl, type Entry, type Photo, type Student } from "@/lib/supabase";
import { computeHours, fmtTime } from "@/lib/hours";
import { compressImage } from "@/lib/image";
import { Skeleton, useUI } from "@/components/UI";

function toLocalInput(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fromLocalInput(date: string, hhmm: string) {
  if (!hhmm) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).toISOString();
}

type Props = {
  student: Student;
  date: string;
  /** "today" shows Time In / Time Out buttons; "past" shows manual time fields. */
  mode: "today" | "past";
  /** Called after any change is saved (so parents can refresh totals/lists). */
  onChange?: () => void;
  /** Called after the whole entry is deleted. */
  onDelete?: () => void;
};

export default function EntryEditor({ student, date, mode, onChange, onDelete }: Props) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [narrative, setNarrative] = useState("");
  const [ai, setAi] = useState<{ narrative: string; tasks: string; learnings: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [editTimes, setEditTimes] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { toast, confirm } = useUI();
  const isToday = mode === "today";

  const load = useCallback(async () => {
    const { data: e } = await supabase.from("entries").select("*").eq("student_id", student.id).eq("date", date).maybeSingle();
    setEntry(e as Entry | null);
    setNarrative((e as Entry | null)?.narrative_ai || (e as Entry | null)?.narrative_raw || "");
    if (e) {
      const { data: p } = await supabase.from("photos").select("*").eq("entry_id", (e as Entry).id).order("created_at");
      setPhotos((p as Photo[]) || []);
    } else setPhotos([]);
    setLoaded(true);
  }, [student.id, date]);

  useEffect(() => { setLoaded(false); setAi(null); load(); }, [load]);

  const ensureEntry = async (): Promise<Entry> => {
    if (entry) return entry;
    const { data, error } = await supabase
      .from("entries")
      .upsert({ student_id: student.id, date }, { onConflict: "student_id,date" })
      .select()
      .single();
    if (error) throw error;
    setEntry(data as Entry);
    return data as Entry;
  };

  const patch = async (fields: Partial<Entry>) => {
    const e = await ensureEntry();
    const next = { ...e, ...fields };
    const hours = computeHours(next.time_in, next.time_out, next.break_minutes);
    const { data, error } = await supabase.from("entries").update({ ...fields, hours }).eq("id", e.id).select().single();
    if (error) throw error;
    setEntry(data as Entry);
    onChange?.();
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try { await fn(); } catch (err) { toast((err as Error).message || "Something went wrong", "error"); }
    setBusy("");
  };

  const upload = (files: FileList | null) =>
    run("upload", async () => {
      if (!files?.length) return;
      const e = await ensureEntry();
      for (const f of Array.from(files)) {
        const blob = await compressImage(f);
        const path = `${student.id}/${date}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        await supabase.from("photos").insert({ entry_id: e.id, storage_path: path });
      }
      await load();
      onChange?.();
      toast(files.length > 1 ? `${files.length} photos uploaded` : "Photo uploaded");
    });

  const removePhoto = async (p: Photo) => {
    const ok = await confirm({ title: "Delete Photo?", message: "This photo will be permanently removed.", confirmText: "Delete", destructive: true });
    if (!ok) return;
    await run("photo", async () => {
      await supabase.storage.from("photos").remove([p.storage_path]);
      await supabase.from("photos").delete().eq("id", p.id);
      setPhotos((ps) => ps.filter((x) => x.id !== p.id));
      onChange?.();
      toast("Photo deleted");
    });
  };

  const enhance = () =>
    run("ai", async () => {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAi(data);
      toast("AI suggestion ready", "info");
    });

  const acceptAi = async () => {
    if (!ai) return;
    if (entry?.narrative_ai && entry.narrative_ai !== narrative) {
      const ok = await confirm({ title: "Replace Narrative?", message: "Your current narrative will be replaced with the AI version.", confirmText: "Replace" });
      if (!ok) return;
    }
    await run("save", async () => {
      await patch({ narrative_raw: entry?.narrative_raw || narrative, narrative_ai: ai.narrative, tasks: ai.tasks, learnings: ai.learnings });
      setNarrative(ai.narrative);
      setAi(null);
      toast("Enhanced narrative saved");
    });
  };

  const discardAi = async () => {
    const ok = await confirm({ title: "Discard Suggestion?", message: "The AI-enhanced version will be lost.", confirmText: "Discard", destructive: true });
    if (ok) setAi(null);
  };

  const timeIn = () =>
    run("in", async () => {
      const now = new Date().toISOString();
      await patch({ time_in: now });
      toast(`Timed in at ${fmtTime(now)}`);
    });

  const timeOut = async () => {
    const ok = await confirm({ title: "Time Out Now?", message: `You'll be clocked out at ${fmtTime(new Date().toISOString())}.`, confirmText: "Time Out" });
    if (!ok) return;
    await run("out", async () => {
      const now = new Date().toISOString();
      const hrs = computeHours(entry?.time_in ?? null, now, entry?.break_minutes ?? 60);
      await patch({ time_out: now });
      toast(`Timed out · ${hrs.toFixed(2)} hours logged`);
    });
  };

  const editTime = (fields: Partial<Entry>) => run("t", async () => { await patch(fields); toast("Time updated"); });

  const saveNarrative = () =>
    run("save", async () => {
      // Edits to an already-enhanced narrative update the AI version; otherwise save the raw draft.
      await patch(entry?.narrative_ai ? { narrative_ai: narrative } : { narrative_raw: narrative });
      toast("Narrative saved");
    });

  const deleteEntry = async () => {
    if (!entry) return;
    const ok = await confirm({ title: "Delete Entry?", message: "This day's time log, photos, and narrative will be permanently removed.", confirmText: "Delete", destructive: true });
    if (!ok) return;
    await run("delete", async () => {
      if (photos.length) await supabase.storage.from("photos").remove(photos.map((p) => p.storage_path));
      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) throw error;
      setEntry(null);
      setPhotos([]);
      setNarrative("");
      setAi(null);
      onChange?.();
      onDelete?.();
      toast("Entry deleted");
    });
  };

  if (!loaded) return <EntrySkeleton />;

  const showTimeFields = !isToday || editTimes;

  return (
    <div className="space-y-4">
      {/* Time */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Time Log</h2>
          {isToday && (
            <button className="text-sm font-medium text-brand-2" onClick={() => setEditTimes((v) => !v)}>{editTimes ? "Done" : "Edit"}</button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-2/10 p-3"><p className="muted text-xs">Time In</p><p className="font-semibold tabular-nums">{fmtTime(entry?.time_in ?? null)}</p></div>
          <div className="rounded-xl bg-brand-2/10 p-3"><p className="muted text-xs">Time Out</p><p className="font-semibold tabular-nums">{fmtTime(entry?.time_out ?? null)}</p></div>
          <div className="rounded-xl bg-sun/25 p-3"><p className="muted text-xs">Hours</p><p className="font-semibold tabular-nums">{Number(entry?.hours || 0).toFixed(2)}</p></div>
        </div>
        {showTimeFields ? (
          <div key={`${date}-${entry?.id ?? "new"}`} className="mt-3 grid grid-cols-3 gap-2">
            <label className="muted text-xs">In<input type="time" className="field mt-1" defaultValue={toLocalInput(entry?.time_in ?? null)} onBlur={(e) => { const v = fromLocalInput(date, e.target.value); if (v !== (entry?.time_in ?? null)) editTime({ time_in: v }); }} /></label>
            <label className="muted text-xs">Out<input type="time" className="field mt-1" defaultValue={toLocalInput(entry?.time_out ?? null)} onBlur={(e) => { const v = fromLocalInput(date, e.target.value); if (v !== (entry?.time_out ?? null)) editTime({ time_out: v }); }} /></label>
            <label className="muted text-xs">Break (min)<input type="number" min={0} className="field mt-1" defaultValue={entry?.break_minutes ?? 60} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== (entry?.break_minutes ?? 60)) editTime({ break_minutes: v }); }} /></label>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn btn-blue" disabled={!!entry?.time_in || !!busy} onClick={timeIn}>Time In</button>
            <button className="btn btn-sun" disabled={!entry?.time_in || !!entry?.time_out || !!busy} onClick={timeOut}>Time Out</button>
          </div>
        )}
        <p className="muted mt-2 text-xs">A {entry?.break_minutes ?? 60}-minute break is deducted for shifts over 5 hours.</p>
      </section>

      {/* Photos */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Photos</h2>
          <label className="btn btn-ghost cursor-pointer !px-3 !py-1.5 text-sm">
            {busy === "upload" ? "Uploading…" : "+ Add"}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
        {photos.length ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl">
                <img src={photoUrl(p.storage_path)} alt="" className="h-full w-full object-cover" />
                <button onClick={() => removePhoto(p)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">No photos yet. Add photos of your work{isToday ? " today" : ""}.</p>
        )}
      </section>

      {/* Narrative */}
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Narrative</h2>
        <textarea
          className="field min-h-40 resize-y leading-relaxed"
          placeholder={`What did you do${isToday ? " today" : " this day"}? Write freely, and AI will polish it.`}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn btn-ghost" disabled={!narrative.trim() || !!busy} onClick={saveNarrative}>{busy === "save" ? "Saving…" : "Save"}</button>
          <button className="btn btn-blue" disabled={!narrative.trim() || !!busy} onClick={enhance}>{busy === "ai" ? "Enhancing…" : "✨ Enhance with AI"}</button>
        </div>

        {ai && (
          <div className="mt-4 rounded-2xl border-2 border-sun bg-sun/10 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sun-2">AI suggestion</p>
            <textarea className="field min-h-32 leading-relaxed" value={ai.narrative} onChange={(e) => setAi({ ...ai, narrative: e.target.value })} />
            <p className="muted mt-3 text-xs font-semibold uppercase">Tasks</p>
            <textarea className="field mt-1 min-h-20 text-sm" value={ai.tasks} onChange={(e) => setAi({ ...ai, tasks: e.target.value })} />
            <p className="muted mt-3 text-xs font-semibold uppercase">Learnings</p>
            <textarea className="field mt-1 min-h-20 text-sm" value={ai.learnings} onChange={(e) => setAi({ ...ai, learnings: e.target.value })} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={discardAi}>Discard</button>
              <button className="btn btn-sun" onClick={acceptAi}>Use this</button>
            </div>
          </div>
        )}
      </section>

      {entry && (
        <button className="btn btn-ghost w-full !text-red-500" disabled={!!busy} onClick={deleteEntry}>
          {busy === "delete" ? "Deleting…" : "Delete Entry"}
        </button>
      )}
    </div>
  );
}

export function EntrySkeleton() {
  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-5">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-3 gap-2"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
        <div className="grid grid-cols-2 gap-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
      </section>
      <section className="card space-y-3 p-5">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-3 gap-2"><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /></div>
      </section>
      <section className="card space-y-3 p-5">
        <Skeleton className="h-5 w-24" /><Skeleton className="h-40" />
      </section>
    </div>
  );
}
