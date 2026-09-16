// Override with GROQ_MODEL; falls back through this list if a model is unavailable.
const MODELS = [process.env.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter(Boolean) as string[];

/** Some models return bullet lists as arrays; normalize every value to a "• "-bulleted string. */
function normalize<T>(obj: Record<string, unknown>): T {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Array.isArray(v) ? v.map((x) => `• ${String(x).replace(/^[•\-*]\s*/, "")}`).join("\n") : String(v ?? "");
  }
  return out as T;
}

export async function groqJSON<T>(system: string, user: string): Promise<T> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  let lastError = "";
  for (const model of MODELS) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      lastError = `Groq error ${res.status} (${model}): ${await res.text()}`;
      // Try the next model only when this one is missing/decommissioned
      if (res.status === 404 || (res.status === 400 && /model/i.test(lastError))) continue;
      throw new Error(lastError);
    }
    const data = await res.json();
    return normalize<T>(JSON.parse(data.choices[0].message.content));
  }
  throw new Error(lastError || "No Groq model available");
}
