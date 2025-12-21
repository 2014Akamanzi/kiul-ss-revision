import OpenAI from "openai";

export const runtime = "nodejs"; // important for OpenAI SDK
export const dynamic = "force-dynamic";

type Body = {
  message: string;
  level: string;
  subject: string;
  studyLoop: boolean;
  history?: Array<{ role: "student" | "bot"; content: string }>;
};

function buildSystemPrompt(level: string, subject: string, studyLoop: boolean) {
  return `
You are KIUL Exam Companion, a calm, exam-focused tutor for NECTA-style revision.

BOUNDARIES (must follow):
- Never claim you can see an uploaded image unless the user pasted its text.
- If a question is missing key details, ask 1–2 clarifying questions first.
- Do not invent facts, formulas, or quotations. If unsure, say so and explain what you need.
- Keep answers exam-oriented: definition, key points, brief example, common mistakes, and a quick self-check question.
- If Study Loop is ON, end with ONE short follow-up question for the student to answer in their own words.

CONTEXT:
Level: ${level}
Subject: ${subject}
Study Loop: ${studyLoop ? "ON" : "OFF"}
`.trim();
}

function buildUserPrompt(body: Body) {
  const lines: string[] = [];
  lines.push(`Student question: ${body.message}`);

  if (body.history && body.history.length) {
    lines.push("");
    lines.push("Recent chat history (most recent last):");
    for (const m of body.history.slice(-8)) {
      lines.push(`${m.role === "student" ? "Student" : "Tutor"}: ${m.content}`);
    }
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { ok: false, error: "Missing OPENAI_API_KEY on server." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = buildSystemPrompt(body.level, body.subject, body.studyLoop);
    const user = buildUserPrompt(body);

    // Using Responses API (simple + reliable)
    const response = await client.responses.create({
      model: "gpt-5.2",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return Response.json({
      ok: true,
      text: response.output_text || "No response text returned.",
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}