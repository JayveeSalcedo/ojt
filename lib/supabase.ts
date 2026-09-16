import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

export type Student = {
  id: string;
  name: string;
  campus: string | null;
  instructor: string | null;
  company: string | null;
  job_description: string | null;
  start_date: string | null;
  end_date: string | null;
  required_hours: number;
};

export type Entry = {
  id: string;
  student_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  hours: number;
  narrative_raw: string | null;
  narrative_ai: string | null;
  tasks: string | null;
  learnings: string | null;
};

export type Photo = { id: string; entry_id: string; storage_path: string };

export function photoUrl(path: string) {
  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}
