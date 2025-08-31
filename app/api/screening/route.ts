import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type QA = { q: string; a: string };
type ScreenResp = { qa: QA[]; notes?: string };

function safeJson(text: string) {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { jd } = await req.json();
    if (!jd || typeof jd !== "string") {
      return NextResponse.json({ error: "Missing jd" }, { status: 400 });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const system =
      "You are a senior recruiter. Extract 5–8 practical screening questions from the JD and provide concise example answers that a good candidate might give. Respond ONLY JSON: { qa: [{q, a}], notes? }. Keep answers short and realistic.";
    const user = `JD:\n${jd}\n\nConstraints:\n- Return only JSON\n- Questions must be specific to the JD and help confirm key skills, location, notice period, domain, tools, etc.`;

    const r = await client.chat.completions.create({
      model: process.env.DEFAULT_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    });

    const content = r.choices[0]?.message?.content ?? "";
    const parsed = safeJson(content) as ScreenResp | null;

    if (!parsed?.qa?.length) {
      return NextResponse.json({ qa: [], notes: "No Q&A parsed." });
    }
    const qa = parsed.qa.slice(0, 8).map(x => ({
      q: String(x.q || "").slice(0, 200),
      a: String(x.a || "").slice(0, 300),
    }));
    return NextResponse.json({ qa, notes: parsed.notes?.slice(0, 200) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Screening failed" }, { status: 500 });
  }
}
