import { NextResponse } from "next/server";
import { groqJSON } from "@/lib/groq";

const SYSTEM = `You help Filipino college student-interns write their daily OJT (on-the-job training) journal.
Rewrite the student's rough narrative into clear, professional, first-person past-tense English (1-3 short paragraphs).
Keep every fact; do not invent tasks, names, or events. Fix grammar and flow.
Also extract:
- "tasks": concise bullet list of tasks accomplished (each line starts with "• ")
- "learnings": concise bullet list of knowledge, skills, and values learned (each line starts with "• ")
Respond ONLY with JSON: {"narrative": string, "tasks": string, "learnings": string}`;

export async function POST(req: Request) {
  try {
    const { narrative } = await req.json();
    if (!narrative || typeof narrative !== "string" || narrative.length > 8000)
      return NextResponse.json({ error: "Narrative is required (max 8000 chars)." }, { status: 400 });
    const out = await groqJSON<{ narrative: string; tasks: string; learnings: string }>(SYSTEM, narrative);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
