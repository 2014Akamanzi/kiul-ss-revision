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

type QType = "definition" | "calculation" | "explain" | "compare" | "essay" | "general";

/**
 * Smarter evaluation uses keyword GROUPS:
 * - Each group is a set of acceptable alternatives.
 * - If any keyword in the group appears, that group is "satisfied".
 */
type KeywordGroup = string[];

type LoopState =
  | { status: "idle" }
  | {
      status: "awaiting_followup_answer";
      followupQuestion: string;
      expectedGroups: KeywordGroup[];
      triesLeft: number;
      originalQuestion: string;
      subject: string;
      level: Level;
      qType: QType;
    };

const STORAGE_KEY = "kiul-ss-revision:chat:v4";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function normalise(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(text: string, group: KeywordGroup) {
  const t = normalise(text);
  return group.some((k) => t.includes(normalise(k)));
}

function scoreGroups(answer: string, groups: KeywordGroup[]) {
  const satisfied: KeywordGroup[] = [];
  const missing: KeywordGroup[] = [];

  for (const g of groups) {
    if (includesAny(answer, g)) satisfied.push(g);
    else missing.push(g);
  }

  const score = satisfied.length / Math.max(1, groups.length);
  return { score, satisfied, missing };
}

function classifyQuestionType(q: string): QType {
  const t = normalise(q);

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
 * Subject keyword banks (MVP).
 * These are generic “must-include” concepts for exam-style answers.
 * They are not topic-perfect (no AI yet), but they raise quality a lot.
 */
function subjectKeywordBank(subjectRaw: string, qType: QType): KeywordGroup[] {
  const subject = normalise(subjectRaw);

  const common: KeywordGroup[] = [
    ["example", "for example", "e.g."],
  ];

  // LANGUAGE
  if (["english", "french", "arabic"].includes(subject)) {
    if (qType === "essay") return [...common, ["introduction", "intro"], ["conclusion", "conclude"], ["because", "therefore"]];
    if (qType === "compare") return [...common, ["whereas", "however", "on the other hand"], ["difference", "different"]];
    return [...common, ["because", "therefore"]];
  }

  if (subject === "kiswahili") {
    // simple Swahili anchors
    return [
      ["mfano", "kwa mfano"],
      ["kwa sababu", "hivyo", "kwa hiyo"],
    ];
  }

  // MATH
  if (subject === "basic mathematics" || subject === "mathematics") {
    if (qType === "calculation") return [...common, ["formula", "method"], ["step", "first"], ["answer", "="]];
    if (qType === "definition") return [...common, ["is", "means"]];
    return [...common, ["rule", "because"]];
  }

  // BIOLOGY
  if (subject === "biology") {
    if (qType === "definition") {
      return [
        ["process", "movement"],
        ["water", "molecule", "substance"],
        ["membrane", "selectively permeable", "semi-permeable"],
        ["concentration", "gradient", "from high to low"],
      ];
    }
    if (qType === "explain") {
      return [
        ["process", "steps", "stage"],
        ["because", "therefore"],
        ["example", "for example"],
      ];
    }
    if (qType === "compare") {
      return [
        ["whereas", "however"],
        ["similarity", "both"],
        ["difference", "different"],
      ];
    }
    return [
      ["process", "movement"],
      ["cause", "because"],
      ["effect", "therefore"],
      ["example", "for example"],
    ];
  }

  // CHEMISTRY
  if (subject === "chemistry") {
    if (qType === "calculation") {
      return [
        ["formula", "equation"],
        ["units", "unit"],
        ["substitute", "substitution", "put in values"],
      ];
    }
    if (qType === "definition") {
      return [
        ["is", "means"],
        ["example", "for example"],
      ];
    }
    return [
      ["equation", "reaction"],
      ["because", "therefore"],
      ["example", "for example"],
    ];
  }

  // PHYSICS
  if (subject === "physics") {
    if (qType === "calculation") {
      return [
        ["formula", "equation"],
        ["units", "unit"],
        ["substitute", "substitution", "put in values"],
      ];
    }
    if (qType === "definition") {
      return [
        ["is", "means"],
        ["unit", "units"],
      ];
    }
    return [
      ["because", "therefore"],
      ["example", "for example"],
      ["unit", "units"],
    ];
  }

  // SOCIAL SCIENCES
  if (subject === "history") {
    if (qType === "essay") {
      return [
        ["context", "background"],
        ["cause", "reason"],
        ["evidence", "example", "for example"],
        ["conclusion", "conclude"],
      ];
    }
    return [
      ["cause", "reason"],
      ["example", "for example", "evidence"],
      ["therefore", "as a result"],
    ];
  }

  if (subject === "geography") {
    return [
      ["factor", "cause", "reason"],
      ["example", "for example", "case", "location"],
      ["impact", "effect", "result"],
    ];
  }

  if (subject === "civics") {
    return [
      ["example", "for example"],
      ["importance", "advantage", "benefit"],
      ["right", "responsibility", "duty", "law"],
    ];
  }

  // BUSINESS
  if (subject === "commerce") {
    return [
      ["example", "for example"],
      ["advantage", "importance", "benefit"],
      ["profit", "cost", "revenue", "market"],
    ];
  }

  if (subject === "bookkeeping") {
    return [
      ["dr", "debit"],
      ["cr", "credit"],
      ["entry", "journal", "ledger"],
    ];
  }

  if (subject === "computer studies") {
    return [
      ["example", "for example"],
      ["function", "purpose", "use"],
      ["steps", "procedure", "process"],
    ];
  }

  // default fallback
  return common;
}

/**
 * Subject-specific follow-up prompts + expected keyword GROUPS.
 * We merge:
 * - prompt template groups (structure)
 * - subject keyword bank groups (subject concepts)
 */
function makeFollowUp(level: Level, subjectRaw: string, userQuestion: string) {
  const subject = normalise(subjectRaw);
  const qType = classifyQuestionType(userQuestion);
  const isACSEE = level === "ACSEE";
  const tighten = (q: string) => (isACSEE ? `${q} (Be precise and concise.)` : q);

  let followupQuestion = tighten("In one or two sentences, restate the main idea in your own words.");
  let structureGroups: KeywordGroup[] = [
    ["because", "therefore"],
    ["example", "for example"],
  ];

  // SUBJECT TEMPLATES (prompts)
  if (subject === "english") {
    if (qType === "essay") {
      followupQuestion = tighten(
        "Write an exam-style plan: Thesis (1 sentence), THREE body points (Point + Evidence + Explanation), then a 1-sentence conclusion."
      );
      structureGroups = [
        ["thesis"],
        ["evidence", "example", "for example"],
        ["conclusion", "conclude"],
        ["1", "2", "3"],
      ];
    } else {
      followupQuestion = tighten(
        "Give a clear answer, then add ONE example (or a brief quotation if applicable) and explain it in one line."
      );
      structureGroups = [
        ["example", "for example", "e.g."],
        ["because", "therefore"],
      ];
    }
  } else if (subject === "kiswahili") {
    followupQuestion = tighten("Jibu kwa sentensi 3–5, kisha toa MFANO mmoja unaoonyesha umeelewa.");
    structureGroups = [
      ["mfano", "kwa mfano"],
      ["kwa sababu", "hivyo", "kwa hiyo"],
    ];
  } else if (["french", "arabic"].includes(subject)) {
    followupQuestion = tighten("Answer in 3–5 sentences and include ONE supporting example.");
    structureGroups = [
      ["example", "for example", "e.g."],
      ["because", "therefore"],
    ];
  } else if (subject === "basic mathematics") {
    followupQuestion = tighten("Write the correct formula/rule, then show ONE worked step.");
    structureGroups = [
      ["formula", "method", "rule"],
      ["step", "first"],
    ];
  } else if (subject === "mathematics") {
    if (qType === "calculation") {
      followupQuestion = tighten("State the method/formula first, then show the FIRST step clearly (before doing the full calculation).");
      structureGroups = [
        ["formula", "method"],
        ["first", "step"],
      ];
    } else {
      followupQuestion = tighten("Write the key rule you will use and explain WHY it applies in this case.");
      structureGroups = [
        ["rule", "formula", "method"],
        ["because", "therefore"],
      ];
    }
  } else if (subject === "biology") {
    if (qType === "compare") {
      followupQuestion = tighten("Give TWO differences and ONE similarity.");
      structureGroups = [
        ["difference", "different"],
        ["similarity", "both"],
        ["whereas", "however"],
      ];
    } else if (qType === "explain") {
      followupQuestion = tighten("List the steps (Step 1, Step 2, Step 3) and give ONE example.");
      structureGroups = [
        ["step", "1"],
        ["step", "2"],
        ["step", "3"],
        ["example", "for example"],
      ];
    } else {
      followupQuestion = tighten("Give a one-sentence definition and include key terms.");
      structureGroups = [
        ["is", "means"],
        ["process", "movement"],
      ];
    }
  } else if (subject === "chemistry") {
    if (qType === "calculation") {
      followupQuestion = tighten("Write the formula/equation, include UNITS, then show the FIRST substitution step.");
      structureGroups = [
        ["formula", "equation"],
        ["units", "unit"],
        ["first", "substitute", "substitution"],
      ];
    } else {
      followupQuestion = tighten("State the principle/law involved and give ONE example or equation.");
      structureGroups = [
        ["law", "principle"],
        ["equation", "reaction"],
        ["example", "for example"],
      ];
    }
  } else if (subject === "physics") {
    if (qType === "calculation") {
      followupQuestion = tighten("State the formula, list known values with UNITS, then show the FIRST substitution.");
      structureGroups = [
        ["formula", "equation"],
        ["units", "unit"],
        ["first", "substitute", "substitution"],
      ];
    } else {
      followupQuestion = tighten("Explain briefly, then give ONE example and mention any unit(s) if relevant.");
      structureGroups = [
        ["example", "for example"],
        ["unit", "units"],
        ["because", "therefore"],
      ];
    }
  } else if (subject === "history") {
    followupQuestion = tighten("Give THREE points and for each point add ONE supporting detail (date/person/place if possible).");
    structureGroups = [
      ["1", "2", "3"],
      ["example", "for example", "evidence"],
    ];
  } else if (subject === "geography") {
    followupQuestion = tighten("Give THREE points and include ONE real example/location/case for at least one point.");
    structureGroups = [
      ["1", "2", "3"],
      ["example", "case", "location", "for example"],
    ];
  } else if (subject === "civics") {
    followupQuestion = tighten("Give THREE points and for each point provide ONE example from society/government.");
    structureGroups = [
      ["1", "2", "3"],
      ["example", "for example"],
    ];
  } else if (subject === "commerce") {
    followupQuestion = tighten("Define the concept, give ONE practical business example, then state ONE advantage/importance.");
    structureGroups = [
      ["example", "for example"],
      ["advantage", "importance", "benefit"],
      ["profit", "market", "cost", "revenue"],
    ];
  } else if (subject === "bookkeeping") {
    followupQuestion = tighten("Write the correct entry (Dr/Cr) and show the FIRST posting step, then explain briefly.");
    structureGroups = [
      ["dr", "debit"],
      ["cr", "credit"],
      ["first", "step"],
    ];
  } else if (subject === "computer studies") {
    followupQuestion = tighten("Explain briefly, then list THREE key features/steps.");
    structureGroups = [
      ["1", "2", "3"],
      ["function", "purpose", "use"],
    ];
  }

  // Merge: structure groups + subject banks
  const bankGroups = subjectKeywordBank(subjectRaw, qType);

  // Keep the list reasonable (avoid making it impossible to pass)
  const merged = [...structureGroups, ...bankGroups];

  // Deduplicate groups (roughly) by joining
  const seen = new Set<string>();
  const expectedGroups: KeywordGroup[] = [];
  for (const g of merged) {
    const key = g.map(normalise).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    expectedGroups.push(g);
    if (expectedGroups.length >= 8) break; // cap for MVP
  }

  return { followupQuestion, expectedGroups, qType };
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

    const { followupQuestion, expectedGroups, qType } = makeFollowUp(
      settings.level,
      settings.subject,
      userText
    );

    addMessage("bot", `Study Loop question:\n${followupQuestion}`);

    setLoopState({
      status: "awaiting_followup_answer",
      followupQuestion,
      expectedGroups,
      triesLeft: 1,
      originalQuestion: userText,
      subject: settings.subject,
      level: settings.level,
      qType,
    });
  }

  function formatGroup(g: KeywordGroup) {
    // show the first option as a “hint”
    return g[0];
  }

  function evaluateFollowUpAnswer(answer: string, state: Extract<LoopState, { status: "awaiting_followup_answer" }>) {
    const { score, satisfied, missing } = scoreGroups(answer, state.expectedGroups);

    const verdict =
      score >= 0.7 ? "Correct" : score >= 0.4 ? "Partly correct" : "Incorrect";

    const includedHints = satisfied.slice(0, 4).map(formatGroup).join(", ");
    const missingHints = missing.slice(0, 4).map(formatGroup).join(", ");

    const guidance =
      verdict === "Correct"
        ? `Good. You included key exam elements for ${state.subject}.`
        : verdict === "Partly correct"
        ? `You are close. Strengthen your answer using missing key terms and structure for ${state.subject}.`
        : `Not yet. Re-answer using the expected structure for ${state.subject}. Include key terms clearly.`;

    const detail =
      `Included (detected): ${includedHints || "—"}\n` +
      `Missing (suggested): ${missingHints || "—"}`;

    addMessage("bot", `${verdict}.\n\nFeedback:\n${guidance}\n\n${detail}`);

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
      `Model outline (prototype):\n- Follow ${state.subject} exam structure.\n- Try to include: ${state.expectedGroups
        .slice(0, 6)
        .map(formatGroup)
        .join(", ")}\n- Keep it clear and exam-style.`
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
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            ← Back to Home
          </Link>
          <span className="text-sm font-semibold text-slate-700">KIUL Exam Companion</span>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl overflow-hidden">
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
                Study Loop evaluates using subject-aware keywords (MVP).
              </p>
            </div>
          </div>

          <div className="px-6 py-6 min-h-[420px] max-h-[520px] overflow-y-auto bg-gradient-to-b from-white to-slate-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500">No messages yet. Start your revision!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
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
