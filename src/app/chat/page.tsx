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
      subject: string;
      level: Level;
      qType: QType;
    };

type QType = "definition" | "calculation" | "explain" | "compare" | "essay" | "general";

const STORAGE_KEY = "kiul-ss-revision:chat:v3";

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

function classifyQuestionType(q: string): QType {
  const t = normalise(q);

  // essay-ish prompts
  if (
    t.includes("discuss") ||
    t.includes("evaluate") ||
    t.includes("assess") ||
    t.includes("analyse") ||
    t.includes("analyze") ||
    t.includes("to what extent") ||
    t.includes("write an essay")
  ) {
    return "essay";
  }

  if (t.startsWith("define") || t.includes("what is") || t.includes("meaning of") || t.includes("define the term")) {
    return "definition";
  }

  if (
    t.includes("calculate") ||
    t.includes("solve") ||
    t.includes("find the value") ||
    t.includes("simplify") ||
    t.includes("differentiate") ||
    t.includes("integrate") ||
    t.match(/\b\d+(\.\d+)?\s*[\+\-\*\/]\s*\d+(\.\d+)?\b/)
  ) {
    return "calculation";
  }

  if (t.includes("compare") || t.includes("difference") || t.includes("distinguish") || t.includes("differentiate between")) {
    return "compare";
  }

  if (t.includes("explain") || t.includes("describe") || t.includes("outline") || t.includes("how") || t.includes("why")) {
    return "explain";
  }

  return "general";
}

/**
 * Subject-specific follow-up templates (MVP).
 * We choose a follow-up question style + expected keywords used for basic evaluation.
 */
function makeFollowUp(level: Level, subjectRaw: string, userQuestion: string) {
  const subject = normalise(subjectRaw);
  const qType = classifyQuestionType(userQuestion);

  const isACSEE = level === "ACSEE";

  const tighten = (q: string) => (isACSEE ? `${q} (Be precise and concise.)` : q);

  // Helpers: common keyword sets
  const kw = {
    point3: ["1", "2", "3"],
    because: ["because"],
    example: ["example"],
    conclude: ["therefore"],
    formulaUnits: ["formula", "units"],
    steps: ["step", "first", "then"],
    evidence: ["example", "because"],
    compare: ["whereas", "however"],
  };

  // Default fallback (works for any subject)
  let followupQuestion = tighten("In one or two sentences, restate the main idea in your own words.");
  let expectedKeywords = ["because", "example"]; // loose

  // ====== LANGUAGE SUBJECTS ======
  const languageTemplate = () => {
    if (qType === "definition") {
      followupQuestion = tighten("Write the definition in ONE sentence, then give ONE example sentence using the term correctly.");
      expectedKeywords = ["is", "example"];
      return;
    }
    if (qType === "compare") {
      followupQuestion = tighten("Give TWO differences, then write ONE short sentence to summarise the contrast.");
      expectedKeywords = ["1", "2", "whereas"];
      return;
    }
    if (qType === "essay") {
      followupQuestion = tighten("Write a short outline: Introduction (1 sentence), THREE body points, Conclusion (1 sentence).");
      expectedKeywords = ["introduction", "conclusion", "1", "2", "3"];
      return;
    }
    followupQuestion = tighten("Answer in 3–5 sentences and include ONE supporting example.");
    expectedKeywords = ["example"];
  };

  // English-specific
  const englishTemplate = () => {
    if (qType === "essay") {
      followupQuestion = tighten(
        "Write an exam-style plan: Thesis (1 sentence), THREE paragraphs (Point + Evidence + Explanation), then a 1-sentence conclusion."
      );
      expectedKeywords = ["thesis", "evidence", "conclusion", "1", "2", "3"];
      return;
    }
    followupQuestion = tighten("Give a clear answer, then add ONE example (or a brief quotation if applicable) and explain it in one line.");
    expectedKeywords = ["example", "because"];
  };

  const kiswahiliTemplate = () => {
    followupQuestion = tighten("Jibu kwa sentensi 3–5, kisha toa MFANO mmoja unaoonyesha umeelewa.");
    expectedKeywords = ["mfano"];
  };

  // ====== MATHEMATICS ======
  const mathTemplate = () => {
    if (qType === "calculation") {
      followupQuestion = tighten("State the method/formula first, then show the FIRST step clearly (before doing the full calculation).");
      expectedKeywords = ["formula", "first"];
      return;
    }
    if (qType === "definition") {
      followupQuestion = tighten("Define the term and then give ONE simple example or representation.");
      expectedKeywords = ["is", "example"];
      return;
    }
    followupQuestion = tighten("Write the key rule you will use and explain WHY it applies in this case.");
    expectedKeywords = ["because", "rule"];
  };

  const basicMathTemplate = () => {
    followupQuestion = tighten("Write the correct formula/rule, then show ONE worked step.");
    expectedKeywords = ["formula", "step"];
  };

  // ====== SCIENCES ======
  const biologyTemplate = () => {
    if (qType === "definition") {
      followupQuestion = tighten("Give a one-sentence definition and mention TWO key terms that must appear in the definition.");
      expectedKeywords = ["is", "movement", "process"];
      return;
    }
    if (qType === "explain") {
      followupQuestion = tighten("List the steps of the process (Step 1, Step 2, Step 3) and give ONE example.");
      expectedKeywords = ["step", "1", "2", "3", "example"];
      return;
    }
    if (qType === "compare") {
      followupQuestion = tighten("Give TWO differences and ONE similarity.");
      expectedKeywords = ["difference", "similarity", "whereas"];
      return;
    }
    followupQuestion = tighten("State ONE key idea, ONE cause, and ONE effect, then give an example.");
    expectedKeywords = ["cause", "effect", "example"];
  };

  const chemistryTemplate = () => {
    if (qType === "calculation") {
      followupQuestion = tighten("Write the formula, include UNITS, then show the FIRST substitution step.");
      expectedKeywords = ["formula", "units", "first"];
      return;
    }
    if (qType === "definition") {
      followupQuestion = tighten("Define the term and give ONE example from common laboratory or daily life.");
      expectedKeywords = ["is", "example"];
      return;
    }
    followupQuestion = tighten("State the principle/law involved and give ONE example or equation.");
    expectedKeywords = ["law", "equation", "example"];
  };

  const physicsTemplate = () => {
    if (qType === "calculation") {
      followupQuestion = tighten("State the formula, list the known values with UNITS, then show the FIRST substitution.");
      expectedKeywords = ["formula", "units", "first"];
      return;
    }
    if (qType === "definition") {
      followupQuestion = tighten("Define the term and state ONE SI unit related to it (if applicable).");
      expectedKeywords = ["is", "unit"];
      return;
    }
    followupQuestion = tighten("Explain the concept briefly, then give ONE example and mention any unit(s) if relevant.");
    expectedKeywords = ["example", "unit"];
  };

  // ====== SOCIAL SCIENCES ======
  const historyTemplate = () => {
    if (qType === "essay") {
      followupQuestion = tighten("Write an outline: Intro (context), THREE causes/points with brief evidence, then a conclusion line.");
      expectedKeywords = ["context", "evidence", "conclusion", "1", "2", "3"];
      return;
    }
    if (qType === "compare") {
      followupQuestion = tighten("Give TWO differences and support each with ONE historical example (event/person/place).");
      expectedKeywords = ["1", "2", "example"];
      return;
    }
    followupQuestion = tighten("Give THREE points and for each point add ONE supporting detail (date/person/place if possible).");
    expectedKeywords = ["1", "2", "3"];
  };

  const geographyTemplate = () => {
    if (qType === "essay") {
      followupQuestion = tighten("Plan your answer: Intro, THREE factors (with examples), impacts, and a short conclusion.");
      expectedKeywords = ["factors", "example", "impacts", "conclusion", "1", "2", "3"];
      return;
    }
    followupQuestion = tighten("Give THREE points and include ONE real example/location/case for at least one point.");
    expectedKeywords = ["1", "2", "3", "example"];
  };

  const civicsTemplate = () => {
    if (qType === "essay") {
      followupQuestion = tighten("Outline: define the key concept, THREE arguments with examples, then conclude with one sentence.");
      expectedKeywords = ["define", "example", "conclude", "1", "2", "3"];
      return;
    }
    followupQuestion = tighten("Give THREE points and for each point provide ONE example from society/government.");
    expectedKeywords = ["1", "2", "3", "example"];
  };

  // ====== BUSINESS SUBJECTS ======
  const commerceTemplate = () => {
    if (qType === "calculation") {
      followupQuestion = tighten("State the formula, show ONE step, then explain what the result means in business terms.");
      expectedKeywords = ["formula", "step", "means"];
      return;
    }
    followupQuestion = tighten("Define the concept and give ONE practical business example, then state ONE advantage or importance.");
    expectedKeywords = ["example", "advantage"];
  };

  const bookkeepingTemplate = () => {
    if (qType === "calculation") {
      followupQuestion = tighten("Write the correct entry/format and show the FIRST posting step (Dr/Cr), then explain briefly.");
      expectedKeywords = ["dr", "cr", "first"];
      return;
    }
    followupQuestion = tighten("State the correct accounting principle and give ONE example of a journal entry (Dr/Cr).");
    expectedKeywords = ["dr", "cr", "principle"];
  };

  const computerStudiesTemplate = () => {
    if (qType === "definition") {
      followupQuestion = tighten("Define the term and give ONE example (device/software/process).");
      expectedKeywords = ["is", "example"];
      return;
    }
    if (qType === "compare") {
      followupQuestion = tighten("Give TWO differences and ONE use-case example.");
      expectedKeywords = ["1", "2", "example"];
      return;
    }
    followupQuestion = tighten("Explain briefly, then list THREE key features/steps.");
    expectedKeywords = ["1", "2", "3"];
  };

  // ========= Dispatch by subject =========
  const subjectKey = subject;

  if (subjectKey === "english") {
    englishTemplate();
  } else if (subjectKey === "kiswahili") {
    kiswahiliTemplate();
  } else if (["french", "arabic"].includes(subjectKey)) {
    languageTemplate();
  } else if (subjectKey === "mathematics") {
    mathTemplate();
  } else if (subjectKey === "basic mathematics") {
    basicMathTemplate();
  } else if (subjectKey === "biology") {
    biologyTemplate();
  } else if (subjectKey === "chemistry") {
    chemistryTemplate();
  } else if (subjectKey === "physics") {
    physicsTemplate();
  } else if (subjectKey === "history") {
    historyTemplate();
  } else if (subjectKey === "geography") {
    geographyTemplate();
  } else if (subjectKey === "civics") {
    civicsTemplate();
  } else if (subjectKey === "commerce") {
    commerceTemplate();
  } else if (subjectKey === "bookkeeping") {
    bookkeepingTemplate();
  } else if (subjectKey === "computer studies") {
    computerStudiesTemplate();
  } else {
    // anything else: fallback
  }

  // Light sanity: avoid too-short keyword sets
  if (expectedKeywords.length < 2) expectedKeywords = expectedKeywords.concat(kw.example);

  return { followupQuestion, expectedKeywords, qType };
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
    const explanation =
      `Prototype explanation (AI will be connected later).\n\n` +
      `Level: ${settings.level}\n` +
      `Subject: ${settings.subject}\n\n` +
      `Exam approach:\n` +
      `1) Identify what the question asks.\n` +
      `2) Recall the key concept/rule.\n` +
      `3) Apply step by step.\n` +
      `4) Present clearly (points, units, examples).\n\n` +
      `Your question:\n"${userText}"`;

    addMessage("bot", explanation);

    if (!settings.studyLoop) return;

    const { followupQuestion, expectedKeywords, qType } = makeFollowUp(
      settings.level,
      settings.subject,
      userText
    );

    addMessage("bot", `Study Loop question:\n${followupQuestion}`);

    setLoopState({
      status: "awaiting_followup_answer",
      followupQuestion,
      expectedKeywords,
      triesLeft: 1, // one retry (2 total attempts)
      originalQuestion: userText,
      subject: settings.subject,
      level: settings.level,
      qType,
    });
  }

  function evaluateFollowUpAnswer(answer: string, state: Extract<LoopState, { status: "awaiting_followup_answer" }>) {
    const score = keywordMatchScore(answer, state.expectedKeywords);

    const verdict =
      score >= 0.67 ? "Correct" : score >= 0.34 ? "Partly correct" : "Incorrect";

    const guidance =
      verdict === "Correct"
        ? "Good. You included the key elements. Move on to the next question."
        : verdict === "Partly correct"
        ? `You are close. Add missing key terms and match the expected exam structure for ${state.subject}.`
        : `Not yet. Use the structure expected in ${state.subject}, and include key terms clearly.`;

    addMessage("bot", `${verdict}.\n\nFeedback:\n${guidance}`);

    if (verdict === "Correct") {
      setLoopState({ status: "idle" });
      return;
    }

    if (state.triesLeft > 0) {
      addMessage("bot", `Try again (one more attempt):\n${state.followupQuestion}`);
      setLoopState({ ...state, triesLeft: state.triesLeft - 1 });
      return;
    }

    addMessage(
      "bot",
      `Model outline (prototype):\n- Use the expected structure for ${state.subject}.\n- Include key terms: ${state.expectedKeywords.join(
        ", "
      )}\n- Keep it clear and exam-style.`
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

    if (loopState.status === "awaiting_followup_answer") {
      evaluateFollowUpAnswer(userContent, loopState);
      return;
    }

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
                Study Loop uses subject-specific exam follow-ups.
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
                    className={`flex ${
                      m.role === "student" ? "justify-end" : "justify-start"
                    }`}
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
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {m.content}
                      </p>
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
