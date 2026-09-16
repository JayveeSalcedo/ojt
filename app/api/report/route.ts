import { NextResponse } from "next/server";
import { groqJSON } from "@/lib/groq";

const SYSTEM = `You fill in a university "Practicum/Internship Weekly Report" for a student-intern.
Given the daily journal entries for ONE week, produce two columns:
- "tasks": TASKS ACCOMPLISHED — bullet list (lines start with "• "), merge duplicates, past tense, concise, max ~10 bullets.
- "learnings": KNOWLEDGE, SKILLS, VALUES LEARNED — bullet list (lines start with "• "), max ~8 bullets.
Only use facts from the entries. Respond ONLY with JSON: {"tasks": string, "learnings": string}`;

type DayIn = { date: string; hours: number; narrative: string };

export async function POST(req: Request) {
  try {
    const { days } = (await req.json()) as { days: DayIn[] };
    if (!Array.isArray(days) || !days.length)
      return NextResponse.json({ error: "No entries for this week." }, { status: 400 });
    const text = days
      .slice(0, 14)
      .map((d) => `Date: ${d.date} (${d.hours} hrs)\n${(d.narrative || "").slice(0, 3000)}`)
      .join("\n\n");
    const out = await groqJSON<{ tasks: string; learnings: string }>(SYSTEM, text);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
