import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { pickModels, shouldFallback } from "@/app/lib/modelRouter";

type GenOut = {
  boolean: string;
  confidence: number;
  booleanId: string;
  generatedAt: string;
  notes?: string;
  modeTried?: string[];
  modelUsed?: string;
};

function id() {
  return "BOOL-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function safeJson(text: string) {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { jd, mode = "standard" } = await req.json();
    if (!jd || typeof jd !== "string") {
      return NextResponse.json({ error: "Missing jd" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const { primary, fallback, qa, test } = pickModels();

    // select model based on mode
    let model = primary;
    if (mode === "boosted") model = fallback;
    if (mode === "qa") model = qa;
    if (mode === "test") model = test;

    const system = `You are a senior boolean search specialist.
Return ONLY JSON with shape:
{ "boolean": string, "confidence": number (0..1), "notes": string? }
Rules:
- Use AND/OR/NOT and quotes appropriately.
- Include essential synonyms and exclude common false positives.
- Keep under ~240 chars if possible.
- Tailor to LinkedIn/X-Ray style general search.`;

    const user = `JOB DESCRIPTION:
${jd}

Output: ONLY JSON as described.`;

    // first attempt
    const first = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    });

    const firstContent = first.choices[0]?.message?.content || "";
    const firstParsed = safeJson(firstContent) as { boolean?: string; confidence?: number; notes?: string } | null;

    let out: GenOut = {
      boolean: firstParsed?.boolean || "",
      confidence: Math.max(0, Math.min(1, Number(firstParsed?.confidence ?? 0.6))),
      booleanId: id(),
      generatedAt: new Date().toISOString(),
      notes: firstParsed?.notes?.slice(0, 300),
      modeTried: [mode],
      modelUsed: model,
    };

    // fallback only for standard mode
    if (mode === "standard" && shouldFallback(out.confidence)) {
      const second = await client.chat.completions.create({
        model: fallback,
        temperature: 0.2,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      });
      const secondContent = second.choices[0]?.message?.content || "";
      const secondParsed = safeJson(secondContent) as { boolean?: string; confidence?: number; notes?: string } | null;

      out = {
        ...out,
        boolean: secondParsed?.boolean || out.boolean,
        confidence: Math.max(out.confidence, Math.max(0, Math.min(1, Number(secondParsed?.confidence ?? out.confidence)))),
        notes: secondParsed?.notes?.slice(0, 300) || out.notes,
        modeTried: [...(out.modeTried || []), "fallback"],
        modelUsed: fallback,
      };
    }

    // minimal guard (never return empty)
    if (!out.boolean) {
      out.boolean = `"(${jd.split(/\W+/).filter(Boolean).slice(0, 4).join(" AND ")})"`;
    }

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Boolean generation failed" }, { status: 500 });
  }
}
