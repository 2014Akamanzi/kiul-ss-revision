"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type ChatRole = "student" | "bot";

type ChatMessage = {
  role: ChatRole;
  content: string;
  imageDataUrl?: string;
  createdAt: number;
};

type Settings = {
  level: "CSEE" | "ACSEE";
  subject: string;
  studyLoop: boolean;
};

const STORAGE_KEY = "kiul-ss-revision:v1";

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!draft && !filePreview) return;

    const userMessage: ChatMessage = {
      role: "student",
      content: draft || "(image uploaded)",
      imageDataUrl: filePreview || undefined,
      createdAt: Date.now(),
    };

    const botMessage: ChatMessage = {
      role: "bot",
      content: `This is a guided revision response (AI will be connected later).

Level: ${settings.level}
Subject: ${settings.subject}

Your question has been received. I will explain step by step and then ask a follow-up question if Study Loop is enabled.`,
      createdAt: Date.now() + 1,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setDraft("");
    setFilePreview(null);
    setFileName(null);
  }

  function onFileChange(file: File | null) {
    if (!file) return;
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () =>
        setFilePreview(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
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
        <div className="rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          {/* Controls */}
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap gap-4">
            <select
              value={settings.level}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  level: e.target.value as Settings["level"],
                }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="CSEE">CSEE (Form IV)</option>
              <option value="ACSEE">ACSEE (Form VI)</option>
            </select>

            <select
              value={settings.subject}
              onChange={(e) =>
                setSettings((s) => ({ ...s, subject: e.target.value }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.studyLoop}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    studyLoop: e.target.checked,
                  }))
                }
              />
              Study Loop
            </label>
          </div>

          {/* Messages */}
          <div className="px-6 py-6 min-h-[420px] max-h-[520px] overflow-y-auto bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-slate-500 text-center mt-20">
                Start by asking a revision question.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.createdAt}
                  className={`mb-4 flex ${
                    m.role === "student" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === "student"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    {m.imageDataUrl && (
                      <img
                        src={m.imageDataUrl}
                        className="mb-2 rounded-xl max-h-48"
                      />
                    )}
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-slate-200 bg-white">
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm mb-3"
              rows={2}
              placeholder="Type your question here…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm px-3 py-2 border rounded-xl"
                >
                  Upload image
                </button>
                {fileName && (
                  <span className="text-xs text-slate-500">{fileName}</span>
                )}
              </div>

              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700"
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
