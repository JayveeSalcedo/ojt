"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, type Student } from "./supabase";

const KEY = "ojt.studentId";

export function getStoredId() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setStoredId(id: string | null) {
  try { id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY); } catch {}
}

export function useStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const id = getStoredId();
    if (!id) { setLoading(false); if (typeof window !== "undefined") window.location.replace("/"); return; }
    const { data } = await supabase.from("students").select("*").eq("id", id).single();
    setStudent(data as Student | null);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { student, loading, reload, setStudent };
}
