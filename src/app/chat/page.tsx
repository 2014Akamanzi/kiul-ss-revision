"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Role = "student" | "bot";

type ChatMessage = {
  role: Role;
  content: string;
  createdAt: number;
};

type Settings = {
  level: "CSEE (Form IV)" | "ACSEE (Form VI)";
  subject: string;
  studyLoop: boolean;
};

const STORAGE_KEY = "kiul-exam-companion:v6";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s\?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Subject keyword banks (MVP evaluation logic only) */
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Biology: [
    "process",
    "movement",
    "diffusion",
    "osmosis",
    "membrane",
    "cell",
    "respiration",
    "photosynthesis",
    "enzyme",
    "transport",
  ],
  Chemistry: [
    "atom",
    "molecule",
    "reaction",
    "acid",
    "base",
    "salt",
    "bond",
    "mole",
    "oxidation",
    "reduction",
    "reactant",
    "product",
    "balanced",
  ],
  Physics: [
    "force",
    "energy",
    "work",
    "power",
    "motion",
    "velocity",
    "acceleration",
    "current",
    "voltage",
    "resistance",
  ],
  Geography: [
    "climate",
    "weather",
    "relief",
    "map",
    "population",
    "migration",
    "soil",
    "erosion",
    "industry",
  ],
  History: [
    "cause",
    "effect",
    "colonial",
    "independence",
    "nationalism",
    "trade",
    "treaty",
    "revolution",
  ],
  English: [
    "meaning",
    "definition",
    "example",
    "grammar",
    "tense",
    "punctuation",
    "summary",
    "comprehension",
    "essay",
  ],
  Mathematics: [
    "simplify",
    "factor",
    "equation",
    "function",
    "solve",
    "angle",
    "geometry",
    "probability",
    "ratio",
    "percent",
  ],
  Civics: ["rights", "responsibilities", "government", "citizen", "constitution", "democracy"],
  Commerce: ["profit", "loss", "capital", "trade", "demand", "supply", "market"],
  Bookkeeping: ["ledger", "journal", "debit", "credit", "trial balance", "assets", "liabilities"],
};

/** Tiny topic detector (MVP) */
const TOPICS: { topic: string; triggers: string[]; keywords: string[]; followUp: string }[] = [
  {
    topic: "Osmosis",
    triggers: ["osmosis"],
    keywords: ["water", "membrane", "semi permeable", "dilute", "concentrated", "movement"],
    followUp: "In one sentence, define osmosis and mention the membrane.",
  },
  {
    topic: "Diffusion",
    triggers: ["diffusion"],
    keywords: ["particles", "movement", "high", "low", "concentration", "gradient"],
    followUp: "Explain diffusion using ‘high concentration’ and ‘low concentration’.",
  },
  {
    topic: "Photosynthesis",
    triggers: ["photosynthesis"],
    keywords: ["chlorophyll", "light", "carbon dioxide", "water", "glucose", "oxygen"],
    followUp: "State the word equation for photosynthesis.",
  },
  {
    topic: "Balancing equations",
    triggers: ["balance", "balancing", "equation", "chemical equation", "reactant", "product"],
    keywords: ["reactant", "product", "balanced", "atom", "coefficient"],
    followUp: "Try this: balance the equation: $$H_2 + O_2 \\rightarrow H_2O$$ (write the balanced form).",
  },
];

function detectTopic(text: string) {
  const t = normalize(text);
  for (const item of TOPICS) {
    if (item.triggers.some((tr) => t.includes(tr))) return item;
  }
  return null;
}

function buildStudyLoopQuestion(subject: string, userQuestion: string) {
  const topic = detectTopic(userQuestion);
  if (topic) return topic.followUp;

  // Make follow-ups DIRECT (no “Would you like…”)
  if (subject === "Chemistry")
    return "Write one balanced chemical equation and label reactants and products.";
  if (subject === "English") return "Restate the main idea in your own words and give one example.";
  if (subject === "Mathematics") return "Write the steps you would use to solve it (no skipping).";
  if (subject === "Biology") return "Explain the process in 2–3 steps using key terms.";
  if (subject === "Physics") return "State the law/formula and explain what each symbol means.";
  if (subject === "Geography") return "Mention the main factors and explain how they lead to the outcome.";
  if (subject === "History") return "State one cause and one effect, then explain briefly.";
  return "In one or two sentences, restate the main idea in your own words.";
}

function evaluateStudentAnswer(params: {
  subject: string;
  userQuestion: string;
  studentAnswer: string;
}) {
  const { subject, userQuestion, studentAnswer } = params;

  const topic = detectTopic(userQuestion);
  const bank = topic?.keywords ?? SUBJECT_KEYWORDS[subject] ?? [];

  const ansRaw = studentAnswer.trim();
  const ans = normalize(studentAnswer);

  // Safety: if the “answer” looks like a NEW QUESTION, do not grade it.
  // (This prevents “Are equations important?” from being scored 0/10.)
  const looksLikeQuestion =
    ansRaw.endsWith("?") || ans.includes("?") || /^why\s|^what\s|^how\s|^when\s|^where\s|^is\s/i.test(ansRaw);

  if (looksLikeQuestion) {
    return {
      score10: null as number | null,
      feedback:
        "That looks like a NEW QUESTION (not an answer to the Study Loop follow-up). Click “Ask new question” then send it again.",
      hitWords: [] as string[],
      expectedHint: bank.slice(0, 8),
    };
  }

  let hits = 0;
  const hitWords: string[] = [];

  for (const kw of bank) {
    const k = normalize(kw);
    if (!k) continue;
    if (ans.includes(k)) {
      hits += 1;
      hitWords.push(kw);
    }
  }

  const max = Math.max(bank.length, 1);
  const ratio = hits / max;
  const score10 = Math.round(Math.min(1, ratio * 1.15) * 10);

  const feedback =
    score10 >= 8
      ? "Strong answer. Add one example to make it complete."
      : score10 >= 5
      ? "Good start. Add missing key terms and make your explanation clearer."
      : "Too general. Use key terms and explain step-by-step.";

  return {
    score10,
    feedback,
    hitWords: hitWords.slice(0, 8),
    expectedHint: bank.slice(0, 8),
  };
}

export default function ChatPage() {
  const subjects = useMemo(
    () => [
      "English",
      "Mathematics",
      "Biology",
      "Chemistry",
      "Physics",
      "Geography",
      "History",
      "Civics",
      "Bookkeeping",
      "Commerce",
    ],
    []
  );

  const [settings, setSettings] = useState<Settings>({
    level: "CSEE (Form IV)",
    subject: "English",
    studyLoop: true,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [hydrated, setHydrated] = useState(false);

  const [pendingStudyLoop, setPendingStudyLoop] = useState<string | null>(null);
  const [lastUserQuestion, setLastUserQuestion] = useState<string>("");

  type NextIntent = "new_question" | "answer_followup";
  const [nextIntent, setNextIntent] = useState<NextIntent>("new_question");

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed?.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed?.messages)) setMessages(parsed.messages);
      if (typeof parsed?.pendingStudyLoop === "string") setPendingStudyLoop(parsed.pendingStudyLoop);
      if (typeof parsed?.lastUserQuestion === "string") setLastUserQuestion(parsed.lastUserQuestion);
      if (parsed?.nextIntent === "new_question" || parsed?.nextIntent === "answer_followup") {
        setNextIntent(parsed.nextIntent);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, messages, pendingStudyLoop, lastUserQuestion, nextIntent })
      );
    } catch {
      // ignore
    }
  }, [hydrated, settings, messages, pendingStudyLoop, lastUserQuestion, nextIntent]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendToAI(userText: string) {
    const apiMessages = [
      ...messages.map((m) => ({
        role: m.role === "student" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: userText },
    ];

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        level: settings.level,
        subject: settings.subject,
        studyLoop: settings.studyLoop,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "API error");
    return String(data?.text ?? "").trim();
  }

  async function onSend() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");

    const followUpActive = Boolean(pendingStudyLoop);

    // If user selected Answer-follow-up, but there is NO follow-up, force new question
    if (!followUpActive && nextIntent === "answer_followup") {
      setNextIntent("new_question");
    }

    // If user chose Answer-follow-up and a follow-up exists, run evaluation
    if (pendingStudyLoop && nextIntent === "answer_followup") {
      const studentMsg: ChatMessage = { role: "student", content: text, createdAt: Date.now() };

      const evaluation = evaluateStudentAnswer({
        subject: settings.subject,
        userQuestion: lastUserQuestion,
        studentAnswer: text,
      });

      // If it looks like a question, do not grade; instead guide user
      if (evaluation.score10 === null) {
        const coachMsg: ChatMessage = {
          role: "bot",
          content: `Teacher check: not graded.\n\n${evaluation.feedback}`,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, studentMsg, coachMsg]);
        setNextIntent("new_question");
        return;
      }

      const coachMsg: ChatMessage = {
        role: "bot",
        content:
          `Teacher check (prototype): Score ${evaluation.score10}/10.\n` +
          `${evaluation.feedback}\n\n` +
          `Key terms found: ${evaluation.hitWords.length ? evaluation.hitWords.join(", ") : "None yet"}\n` +
          `Suggested terms: ${evaluation.expectedHint.join(", ")}`,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, studentMsg, coachMsg]);
      setPendingStudyLoop(null);
      setNextIntent("new_question");
      return;
    }

    // Otherwise: treat as new question
    setLastUserQuestion(text);

    const userMsg: ChatMessage = { role: "student", content: text, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    setBusy(true);
    try {
      const aiText = await sendToAI(text);

      const botMsg: ChatMessage = {
        role: "bot",
        content: aiText || "I could not generate a response. Please try again.",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (settings.studyLoop) {
        setPendingStudyLoop(buildStudyLoopQuestion(settings.subject, text));
      }

      setNextIntent("new_question");
    } catch (e: any) {
      setMessages((prev) => [
        { role: "bot", content: `Error: ${e?.message ?? "Something went wrong."}`, createdAt: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setPendingStudyLoop(null);
    setLastUserQuestion("");
    setNextIntent("new_question");
  }

  const followUpActive = Boolean(pendingStudyLoop);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to Home
          </Link>
          <div className="text-sm font-semibold text-slate-800">KIUL Exam Companion</div>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Level:</span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={settings.level}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, level: e.target.value as Settings["level"] }))
                }
              >
                <option value="CSEE (Form IV)">CSEE (Form IV)</option>
                <option value="ACSEE (Form VI)">ACSEE (Form VI)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Subject:</span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={settings.subject}
                onChange={(e) => setSettings((s) => ({ ...s, subject: e.target.value }))}
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.studyLoop}
                onChange={(e) => setSettings((s) => ({ ...s, studyLoop: e.target.checked }))}
              />
              <span className="font-semibold">Study Loop</span>
            </label>

            <div className="ml-auto">
              <button
                onClick={clearChat}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear chat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
            <aside className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">How to use this page</div>
                <div className="mt-2 text-sm text-slate-700 space-y-2">
                  <p>1) Choose your Level and Subject.</p>
                  <p>2) Ask a question (exam question or your own question).</p>
                  <p>3) If Study Loop appears, you can answer it to get a teacher check.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Study Loop</div>
                <p className="mt-2 text-sm text-slate-700">
                  After your question, you may get one follow-up prompt. If you want teacher-style checking,
                  choose <span className="font-semibold">Answer follow-up (Evaluate)</span> before you send.
                </p>

                {pendingStudyLoop ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-sm font-semibold text-slate-800">Follow-up question</div>
                    <div className="mt-1 text-sm text-slate-700">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {pendingStudyLoop}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500">
                    No follow-up question yet. Ask your first question to begin.
                  </div>
                )}
              </div>
            </aside>

            <section className="lg:col-span-8 flex flex-col">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-[56vh] overflow-y-auto p-5">
                  {!hydrated ? (
                    <div className="h-full flex items-center justify-center text-slate-400">Loading chat…</div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No messages yet. Start your revision!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
                              m.role === "student"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-900 border-slate-200"
                            }`}
                          >
                            {/* Markdown + KaTeX rendering */}
                            <div className="prose prose-sm max-w-none prose-slate whitespace-pre-wrap">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                <div className="border-t border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="text-xs text-slate-500">
                      Next message will be treated as:{" "}
                      <span className="font-semibold text-slate-700">
                        {nextIntent === "new_question" ? "New question" : "Answer to follow-up"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNextIntent("new_question")}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold border transition ${
                          nextIntent === "new_question"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Ask new question
                      </button>

                      <button
                        type="button"
                        onClick={() => setNextIntent("answer_followup")}
                        disabled={!followUpActive}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold border transition ${
                          !followUpActive
                            ? "bg-white text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                            : nextIntent === "answer_followup"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Answer follow-up (Evaluate)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <textarea
                      className="flex-1 min-h-[44px] max-h-40 rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder={
                        followUpActive && nextIntent === "answer_followup"
                          ? "Type your answer to the follow-up…"
                          : "Type your question…"
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSend();
                        }
                      }}
                      disabled={busy}
                    />
                    <button
                      onClick={onSend}
                      disabled={busy || !input.trim()}
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold shadow-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busy ? "…" : "Send"}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">Enter to send. Shift+Enter for a new line.</div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">KIUL Exam Companion · Prototype mode</div>
      </div>
    </main>
  );
}
