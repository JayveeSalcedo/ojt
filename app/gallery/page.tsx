"use client";
import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import { supabase, photoUrl, type Entry, type Photo } from "@/lib/supabase";
import { useStudent } from "@/lib/useStudent";
import { fmtDate } from "@/lib/hours";
import { Skeleton } from "@/components/UI";

type DateGroup = { date: string; photos: Photo[] };

export default function Gallery() {
  const { student } = useStudent();
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!student) return;
    // Fetch all entries for this student (we need date + id)
    const { data: entries } = await supabase
      .from("entries")
      .select("id, date")
      .eq("student_id", student.id)
      .order("date", { ascending: false });
    const list = (entries as Pick<Entry, "id" | "date">[]) || [];
    if (!list.length) {
      setGroups([]);
      setLoading(false);
      return;
    }
    // Fetch all photos for those entries
    const { data: ph } = await supabase
      .from("photos")
      .select("*")
      .in("entry_id", list.map((e) => e.id))
      .order("created_at", { ascending: false });
    const allPhotos = (ph as Photo[]) || [];

    // Build entry_id → date map
    const dateMap = new Map<string, string>();
    for (const e of list) dateMap.set(e.id, e.date);

    // Group photos by date
    const byDate = new Map<string, Photo[]>();
    for (const p of allPhotos) {
      const d = dateMap.get(p.entry_id);
      if (!d) continue;
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(p);
    }

    // Convert to sorted array (newest first)
    const sorted = [...byDate.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, photos]) => ({ date, photos }));

    setGroups(sorted);
    setLoading(false);
  }, [student]);

  useEffect(() => { load(); }, [load]);

  // Lock background scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  const totalPhotos = groups.reduce((s, g) => s + g.photos.length, 0);

  return (
    <main className="pb-safe">
      <TopBar title="Gallery" subtitle={student?.name} />
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        {/* Summary */}
        {!loading && (
          <p className="muted text-sm">
            {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} across {groups.length} day{groups.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            {[0, 1].map((k) => (
              <section key={k}>
                <Skeleton className="mb-2 ml-1 h-3 w-36" />
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-square !rounded-xl" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !groups.length && (
          <div className="card p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-2/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <p className="text-lg font-semibold">No photos yet</p>
            <p className="muted mt-1 text-sm">Photos you upload to your daily entries will appear here.</p>
          </div>
        )}

        {/* Photo groups by date */}
        {groups.map((g) => (
          <section key={g.date}>
            <h2 className="muted mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide">
              {fmtDate(g.date, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
              <span className="ml-2 normal-case tracking-normal text-brand-2">
                {g.photos.length} photo{g.photos.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-1.5">
              {g.photos.map((p) => (
                <button
                  key={p.id}
                  className="relative aspect-square overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-2"
                  onClick={() => setLightbox(p.storage_path)}
                >
                  <img
                    src={photoUrl(p.storage_path)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <img
            src={photoUrl(lightbox)}
            alt=""
            className="max-h-[85dvh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <TabBar />
    </main>
  );
}
