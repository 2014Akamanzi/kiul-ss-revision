"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "student" | "bot";

type ChatMessage = {
  role: ChatRole;
  content: string;
  imageDataUrl?: string; // local preview only (prototype)
  createdAt: number;
};

type Settings = {
  level: "CSEE" | "ACSEE";
  subject: string;
  studyLoop: boolean;
};

const STORAGE_KEY = "kiul-ss-revision:v1";

function clampText(s: string, max = 6000) {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max) + "…";
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
      "Social Studies",
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
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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
      };
      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
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
        })
      );
    } catch {
      // ignore
    }
  }, [settings, messages]);

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

    // Local preview only for images (prototype)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function addBotPlaceholder(userText: string) {
    // Placeholder bot response (no OpenAI yet)
    const loopLine = settings.studyLoop
      ? "Study Loop is ON, so I will ask a follow-up question after the explanation."
      : "Study Loop is OFF, so I will answer once, clearly and directly.";

    const response = `Prototype response (AI not connected yet).

Level: ${settings.level}
Subject: ${settings.subject}

You asked: "${clampText(userText, 300)}"

Next step: When we connect OpenAI, I will provide step-by-step explanations and exam-style practice questions.
${loopLine}`;

    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: response,
        createdAt: Date.now(),
      },
    ]);
  }

  function sendMessage() {
    const text = clampText(draft);
    const hasText = text.length > 0;
    const hasImage = !!filePreview;

    if (!hasText && !hasImage) return;

    const newMsg: ChatMessage = {
      role: "student",
      content: hasText ? text : "(image uploaded)",
      imageDataUrl: filePreview || undefined,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setDraft("");
    clearAttachment();

    addBotPlaceholder(hasText ? text : "Image uploaded (question).");
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
              <span className="text-slate-900 font-bold">KIUL</span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Katoki Institute of Ubuntu Leadership
              </p>
              <p className="text-sm font-semibold text-slate-800">KIUL Exam Companion</p>
            </div>
          </div>

          {/* (Removed “MVP” badge on purpose) */}
          <span className="text-xs font-semibold text-slate-500">&nbsp;</span>
        </div>

        {/* Chat card */}
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
                      setSettings((s) => ({ ...s, level: e.target.value as Settings["level"] }))
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
                    onChange={(e) => setSettings((s) => ({ ...s, subject: e.target.value }))}
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
                    onChange={(e) => setSettings((s) => ({ ...s, studyLoop: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  <span className="font-semibold">Study Loop</span>
                </label>
              </div>

              <p className="text-xs text-slate-500">
                Tip: Choose Level and Subject for focused revision.
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
                    key={m.createdAt}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <textarea
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={2}
                  placeholder="Type your question (press Enter to send, Shift+Enter for a new line)…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                />

                <div className="mt-2 flex items-center justify-between gap-2">
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
                        <span className="truncate max-w-[220px]">{fileName}</span>
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
            {/* Removed any visible “MVP note” line */}
          </div>
        </div>
      </div>
    </main>
  );
}
