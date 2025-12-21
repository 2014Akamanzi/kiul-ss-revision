"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "student" | "bot";

type ChatMessage = {
  role: ChatRole;
  content: string;
  createdAt: number; // ms
};

type Settings = {
  level: "CSEE (Form IV)" | "ACSEE (Form VI)";
  subject: string;
  studyLoop: boolean;
};

const STORAGE_KEY = "kiul-exam-companion:v1";

const defaultSettings: Settings = {
  level: "CSEE (Form IV)",
  subject: "English",
  studyLoop: true,
};

function safeJsonParse<T>(value: string | null, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default function ChatPage() {
  const subjects = useMemo(
    () => [
      "English",
      "French",
      "Arabic",
      "Basic Mathematics",
      "Biology",
      "Chemistry",
      "Physics",
      "Geography",
      "History",
      "Civics",
    ],
    []
  );

  const [mounted, setMounted] = useState(false);

  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    const saved = safeJsonParse<{ settings?: Settings }>(
      window.localStorage.getItem(STORAGE_KEY),
      {}
    );
    return saved.settings ?? defaultSettings;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = safeJsonParse<{ messages?: ChatMessage[] }>(
      window.localStorage.getItem(STORAGE_KEY),
      {}
    );
    return saved.messages ?? [];
  });

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastStudyLoopPrompt, setLastStudyLoopPrompt] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, messages })
    );
  }, [mounted, settings, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function getGuidancePanelText() {
    const base =
      "Exam approach:\n" +
      "1) Identify what the question asks.\n" +
      "2) Recall the key concept or rule.\n" +
      "3) Apply step by step.\n" +
      "4) Present clearly (points, units, examples).\n";

    const subjectTips: Record<string, string> = {
      Biology:
        "\nBiology tips:\n- Define the process.\n- Mention key structures (membrane, cells).\n- Use keywords like diffusion, osmosis, photosynthesis, respiration.\n",
      Chemistry:
        "\nChemistry tips:\n- Write the equation if relevant.\n- Mention conditions (heat, catalyst).\n- Use keywords like reaction, ions, pH, oxidation, reduction.\n",
      Physics:
        "\nPhysics tips:\n- State the law/principle.\n- Write the formula and units.\n- Use keywords like force, energy, current, voltage, resistance, motion.\n",
      "Basic Mathematics":
        "\nMath tips:\n- Show steps.\n- Use correct formula.\n- Check the final answer.\n",
      English:
        "\nEnglish tips:\n- Define clearly.\n- Give a short example.\n- Keep sentences simple and correct.\n",
      French:
        "\nFrench tips:\n- Give meaning + example.\n- Use correct tense.\n",
      Arabic:
        "\nArabic tips:\n- Explain meaning + a simple example.\n",
      Geography:
        "\nGeography tips:\n- Define the term.\n- Mention causes and effects.\n- Use examples (Tanzania, Africa) where helpful.\n",
      History:
        "\nHistory tips:\n- Give context (when/where).\n- Mention causes, key actors, and outcomes.\n",
      Civics:
        "\nCivics tips:\n- Define the concept.\n- Mention roles, rights, responsibilities.\n",
    };

    return base + (subjectTips[settings.subject] ?? "");
  }

  function buildStudyLoopPrompt(lastBotText: string) {
    // Simple MVP: one follow-up prompt
    if (!settings.studyLoop) return "";
    return (
      "Study Loop question:\n" +
      "In one or two sentences, restate the main idea in your own words."
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || isSending) return;

    const studentMsg: ChatMessage = {
      role: "student",
      content: text,
      createdAt: Date.now(),
    };

    setMessages((m) => [...m, studentMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          level: settings.level,
          subject: settings.subject,
          studyLoop: settings.studyLoop,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const botText =
        data?.ok && data?.text
          ? String(data.text)
          : "Sorry — AI is not connected yet (or the server is missing OPENAI_API_KEY).";

      const botMsg: ChatMessage = {
        role: "bot",
        content: botText,
        createdAt: Date.now(),
      };

      setMessages((m) => [...m, botMsg]);

      const loop = buildStudyLoopPrompt(botText);
      setLastStudyLoopPrompt(loop);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          content:
            "Network/server error. Please try again. (If local dev: check OPENAI_API_KEY and restart.)",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    setMessages([]);
    setLastStudyLoopPrompt("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Home
          </Link>

          <div className="text-sm font-semibold text-slate-700">
            KIUL Exam Companion
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-xl overflow-hidden">
          {/* Controls bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-5 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Level:
              </label>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={settings.level}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    level: e.target.value as Settings["level"],
                  }))
                }
              >
                <option>CSEE (Form IV)</option>
                <option>ACSEE (Form VI)</option>
              </select>

              <label className="text-sm font-semibold text-slate-700">
                Subject:
              </label>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={settings.subject}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, subject: e.target.value }))
                }
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.studyLoop}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, studyLoop: e.target.checked }))
                  }
                />
                Study Loop
              </label>
            </div>

            <button
              onClick={clearChat}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Clear
            </button>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left guidance column */}
            <aside className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 bg-white/60">
              <h2 className="text-lg font-semibold text-slate-900">
                How to answer (exam style)
              </h2>

              <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                {getGuidancePanelText()}
              </pre>

              {settings.studyLoop && lastStudyLoopPrompt ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    Study Loop
                  </div>
                  <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                    {lastStudyLoopPrompt}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-500">
                  Tip: Turn on Study Loop for a quick follow-up question after each answer.
                </div>
              )}
            </aside>

            {/* Right chat column */}
            <section className="lg:col-span-3 p-6">
              <div className="h-[52vh] md:h-[58vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No messages yet. Start your revision!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          m.role === "student" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
                            m.role === "student"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-800 border-slate-200"
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {m.content}
                          </div>

                          {/* Timestamp: render only after mount to avoid hydration mismatch */}
                          <div
                            className={`mt-2 text-[11px] opacity-80 ${
                              m.role === "student"
                                ? "text-white/80"
                                : "text-slate-500"
                            }`}
                            suppressHydrationWarning
                          >
                            {mounted
                              ? new Date(m.createdAt).toLocaleString()
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder={
                    settings.studyLoop && lastStudyLoopPrompt
                      ? "Answer the Study Loop question… (Enter to send, Shift+Enter new line)"
                      : "Type your question… (Enter to send, Shift+Enter new line)"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={3}
                  disabled={isSending}
                />

                <div className="flex items-center justify-end">
                  <button
                    onClick={send}
                    disabled={isSending || !input.trim()}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSending ? "Sending…" : "Send"}
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  Note: AI is now connected via <code>/api/chat</code> (make sure OPENAI_API_KEY is set).
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
