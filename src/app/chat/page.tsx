"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Level = "CSEE" | "ACSEE";

type ChatRole = "student" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  imageDataUrl?: string;
  createdAt: number;
};

type Settings = {
  level: Level;
  subject: string;
  studyLoop: boolean;
};

type LoopState =
  | { status: "idle" }
  | {
      status: "awaiting_followup_answer";
      followupQuestion: string;
      expectedKeywords: string[];
      triesLeft: number;
      originalQuestion: string;
    };

const STORAGE_KEY = "kiul-ss-revision:chat:v2";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function normalise(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function keywordMatchScore(answer: string, keywords: string[]) {
  const a = normalise(answer);
  if (!a) return 0;
  const hits = keywords.filter((k) => a.includes(normalise(k)));
  return hits.length / Math.max(1, keywords.length);
}

function classifyQuestionType(q: string) {
  const t = normalise(q);
  if (t.startsWith("define") || t.includes("what is") || t.includes("meaning of")) return "definition";
  if (t.includes("calculate") || t.includes("solve") || t.match(/\b\d+[\+\-\*\/]\d+\b/)) return "calculation";
  if (t.includes("explain") || t.includes("discuss") || t.includes("describe")) return "explain";
  if (t.includes("compare") || t.includes("difference") || t.includes("distinguish")) return "compare";
  return "general";
}

function makeFollowUp(level: Level, subject: string, userQuestion: string) {
  // Very simple follow-up generation rules (MVP), subject-aware only at a basic level.
  const qType = classifyQuestionType(userQuestion);

  // Default
  let followupQuestion = "In one or two sentences, restate the main idea in your own words.";
  let expectedKeywords = ["main", "because"]; // very loose

  // Subject hints
  const subj = normalise(subject);

  if (qType === "definition") {
    followupQuestion = "Give a one-sentence definition, and include one key term that must appear in the definition.";
    expectedKeywords = ["is", "process"]; // loose but nudges structure
  }

  if (qType === "compare") {
    followupQuestion = "State TWO differences clearly (Difference 1…, Difference 2…).";
    expectedKeywords = ["difference", "1", "2"];
  }

  if (qType === "calculation") {
    followupQuestion =
      "Write the formula or method you would use first (even before calculating), and say why it applies.";
    expectedKeywords = ["formula", "because"];
  }

  if (qType === "explain") {
    followupQuestion = "Give one example that proves you understood the explanation.";
    expectedKeywords = ["example"];
  }

  // Slight tightening for sciences
  if (["biology", "chemistry", "physics"].includes(subj)) {
    if (qType === "definition") expectedKeywords = ["is", "movement", "process"];
    if (qType === "calculation") expectedKeywords = ["formula", "units"];
    if (qType === "explain") expectedKeywords = ["example", "because"];
  }

  // Slight tightening for civics/history/geography
  if (["civics", "history", "geography"].includes(subj)) {
    if (qType === "definition") expectedKeywords = ["is", "means"];
    if (qType === "compare") expectedKeywords = ["difference", "whereas"];
    if (qType === "explain") expectedKeywords = ["example", "because"];
  }

  // Math
  if (subj.includes("mathematics")) {
    if (qType === "calculation") expectedKeywords = ["formula", "because"];
    if (qType === "definition") expectedKeywords = ["is", "means"];
  }

  // Level hint (very light)
  if (level === "ACSEE") {
    // Encourage more precision
    followupQuestion += " (Try to be precise and concise.)";
  }

  return { followupQuestion, expectedKeywords };
}

export default function ChatPage() {
  const subjects = useMemo(
    () => [
      "English",
      "Kiswahili",
      "French",
      "Arabic",
      "Basic Mathematics",
      "Mathematics",
      "Biology",
      "Chemistry",
      "Physics",
      "Geography",
      "History",
      "Civics",
      "Commerce",
      "Bookkeeping",
      "Computer Studies",
    ],
    []
  );

  const [settings, setSettings] = useState<Settings>({
    level: "CSEE",
    subject: "English",
    studyLoop: true,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loopState, setLoopState] = useState<LoopState>({ status: "idle" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        settings?: Settings;
        messages?: ChatMessage[];
        loopState?: LoopState;
      };
      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
      if (parsed.loopState) setLoopState(parsed.loopState);
    } catch {
      // ignore
    }
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings,
          messages,
          loopState,
        })
      );
    } catch {
      // ignore
    }
  }, [settings, messages, loopState]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function clearAttachment() {
    setFileName(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onPickFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () =>
        setFilePreview(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function addMessage(role: ChatRole, content: string, imageDataUrl?: string) {
    setMessages((prev) => [
      ...prev,
      { id: uid(), role, content, imageDataUrl, createdAt: Date.now() },
    ]);
  }

  function botExplainAndMaybeFollowUp(userText: string) {
    // Prototype explanation (no AI yet) — structured, exam-oriented
    const explanation =
      `Prototype explanation (AI will be connected later).\n\n` +
      `Level: ${settings.level}\n` +
      `Subject: ${settings.subject}\n\n` +
      `How to approach this in exams:\n` +
      `1) Identify what the question is asking.\n` +
      `2) Recall the key concept / rule.\n` +
      `3) Apply it step by step.\n` +
      `4) Present the answer clearly (and with units/points where relevant).\n\n` +
      `Your question:\n"${userText}"`;

    addMessage("bot", explanation);

    if (!settings.studyLoop) return;

    const { followupQuestion, expectedKeywords } = makeFollowUp(
      settings.level,
      settings.subject,
      userText
    );

    addMessage("bot", `Study Loop question:\n${followupQuestion}`);

    setLoopState({
      status: "awaiting_followup_answer",
      followupQuestion,
      expectedKeywords,
      triesLeft: 1, // one retry (total 2 attempts)
      originalQuestion: userText,
    });
  }

  function evaluateFollowUpAnswer(answer: string, state: Extract<LoopState, { status: "awaiting_followup_answer" }>) {
    const score = keywordMatchScore(answer, state.expectedKeywords);

    // Simple thresholds
    const verdict =
      score >= 0.67 ? "Correct" : score >= 0.34 ? "Partly correct" : "Incorrect";

    const guidance =
      verdict === "Correct"
        ? "Good. You captured the key idea. Now you can proceed to the next question."
        : verdict === "Partly correct"
        ? "You are close. Add missing key terms and make your statement more precise."
        : "Not yet. Re-read the question and include the key terms that define the idea.";

    addMessage(
      "bot",
      `${verdict}.\n\nFeedback:\n${guidance}`
    );

    if (verdict === "Correct") {
      setLoopState({ status: "idle" });
      return;
    }

    if (state.triesLeft > 0) {
      addMessage(
        "bot",
        `Try again (one more attempt):\n${state.followupQuestion}`
      );
      setLoopState({
        ...state,
        triesLeft: state.triesLeft - 1,
      });
      return;
    }

    // No tries left — give a gentle model outline (still prototype)
    addMessage(
      "bot",
      `Model outline (prototype):\n- Use one clear sentence.\n- Include key terms: ${state.expectedKeywords.join(
        ", "
      )}\n- Add one brief example if relevant.`
    );
    setLoopState({ status: "idle" });
  }

  function sendMessage() {
    const text = draft.trim();
    const hasText = text.length > 0;
    const hasImage = !!filePreview;

    if (!hasText && !hasImage) return;

    const userContent = hasText ? text : "(image uploaded)";
    addMessage("student", userContent, filePreview || undefined);

    setDraft("");
    clearAttachment();

    // If we are in Study Loop awaiting an answer, evaluate it.
    if (loopState.status === "awaiting_followup_answer") {
      evaluateFollowUpAnswer(userContent, loopState);
      return;
    }

    // Otherwise: answer + follow-up
    botExplainAndMaybeFollowUp(hasText ? text : "Image uploaded (question).");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Home
          </Link>

          <span className="text-sm font-semibold text-slate-700">
            KIUL Exam Companion
          </span>
        </div>

        {/* Chat container */}
        <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl overflow-hidden">
          {/* Controls */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Level:</span>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={settings.level}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        level: e.target.value as Settings["level"],
                      }))
                    }
                  >
                    <option value="CSEE">CSEE (Form IV)</option>
                    <option value="ACSEE">ACSEE (Form VI)</option>
                  </select>
                </label>

                <label className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Subject:</span>
                  <select
                    className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={settings.subject}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, subject: e.target.value }))
                    }
                  >
                    {subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-700 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.studyLoop}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, studyLoop: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  <span className="font-semibold">Study Loop</span>
                </label>
              </div>

              <p className="text-xs text-slate-500">
                Study Loop asks a follow-up and checks your reply.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="px-6 py-6 min-h-[420px] max-h-[520px] overflow-y-auto bg-gradient-to-b from-white to-slate-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500">No messages yet. Start your revision!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={[
                        "max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm border",
                        m.role === "student"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-800 border-slate-200",
                      ].join(" ")}
                    >
                      {m.imageDataUrl ? (
                        <div className="mb-3">
                          <img
                            src={m.imageDataUrl}
                            alt="Uploaded question"
                            className="max-h-56 rounded-xl border border-slate-200 object-contain bg-white"
                          />
                        </div>
                      ) : null}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-white">
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={2}
              placeholder={
                loopState.status === "awaiting_followup_answer"
                  ? "Answer the Study Loop question… (Enter to send, Shift+Enter for new line)"
                  : "Type your question… (Enter to send, Shift+Enter for new line)"
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload image
                </button>

                {fileName ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate max-w-[240px]">{fileName}</span>
                    <button
                      type="button"
                      className="text-slate-600 hover:text-slate-900 underline"
                      onClick={clearAttachment}
                    >
                      remove
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
