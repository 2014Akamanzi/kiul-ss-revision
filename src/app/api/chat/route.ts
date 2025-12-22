import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * KIUL Exam Companion – API Route (Exam Coach Mode)
 * - NECTA-style, mark-oriented answers
 * - Plain text only (no markdown bold)
 */

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type Body = {
  messages?: IncomingMessage[];
  level?: string;
  subject?: string;
  studyLoop?: boolean;
};

function safeString(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

function clampMessages(messages: IncomingMessage[], max = 20) {
  return messages.slice(-max);
}

function makeSystemPrompt(params: {
  level: string;
  subject: string;
  studyLoop: boolean;
}) {
  const { level, subject, studyLoop } = params;

  return `
You are KIUL Exam Companion, an exam coach for NECTA revision in Tanzania.

Context:
- Level: ${level}
- Subject: ${subject}

ROLE
- You help students score marks in exams.
- You explain clearly, briefly, and in an exam-oriented way.

ANSWER STYLE
- Use simple English.
- Be direct and structured.
- Avoid long paragraphs.
- Do NOT use markdown emphasis.

MANDATORY ANSWER STRUCTURE
Always respond using these numbered sections:

1) Direct answer (NECTA style)
- One short paragraph or 2–3 sentences.

2) Key points to mention
- 3–6 bullet points using "-" only.
- Each point should earn marks.

3) Brief example (if relevant)
- 1–3 lines.
- Use a familiar school-level example.

4) Common mistakes
- 2–4 bullet points using "-" only.
- Focus on mistakes NECTA penalises.

5) How to score full marks
- 3–5 bullet points.
- Tell the student exactly what to include.

${studyLoop ? "6) Study Loop question\n- ONE short question for the student to answer next." : ""}

BOUNDARIES
- Do not invent past paper questions or official mark schemes.
- If information is missing, ask 1–2 clarifying questions first.
- If unsure, say so briefly and explain what is known.

EQUATIONS
- Write equations in plain text.
- Example: 2H2 + O2 -> 2H2O
- Do not use LaTeX.

GOAL
- The student should know exactly how to answer this question in an exam.
`.trim();
}

async function callOpenAI(args: {
  apiKey: string;
  messages: IncomingMessage[];
  level: string;
  subject: string;
  studyLoop: boolean;
}) {
  const systemPrompt = makeSystemPrompt(args);

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      ...clampMessages(args.messages, 20),
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || "OpenAI API error");
  }

  return json.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing in .env.local" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Body;

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const level = safeString(body.level, "CSEE (Form IV)");
    const subject = safeString(body.subject, "English");
    const studyLoop = Boolean(body.studyLoop);

    if (!messages.length) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const text = await callOpenAI({
      apiKey,
      messages,
      level,
      subject,
      studyLoop,
    });

    return NextResponse.json({ text }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
