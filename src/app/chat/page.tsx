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

/** Keyword GROUPS: any term in a group satisfies that group. */
type KeywordGroup = string[];

type TopicId =
  | "osmosis"
  | "diffusion"
  | "photosynthesis"
  | "respiration"
  | "cell_division"
  | "genetics"
  | "motion_speed_velocity"
  | "newton_laws"
  | "electricity"
  | "acids_bases"
  | "moles_stoichiometry"
  | "periodic_table"
  | "supply_demand"
  | "accounting_drcr"
  | "computer_networks"
  | "computer_databases"
  | "general";

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
      topic: TopicId;
    };

const STORAGE_KEY = "kiul-ss-revision:chat:v5";

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
 * Tiny topic detector (MVP):
 * - Uses simple keyword matching on the ORIGINAL question.
 * - Returns a TopicId which unlocks a stronger keyword bank.
 */
function detectTopic(subjectRaw: string, q: string): TopicId {
  const subject = normalise(subjectRaw);
  const t = normalise(q);

  // Biology
  if (subject === "biology") {
    if (t.includes("osmosis")) return "osmosis";
    if (t.includes("diffusion")) return "diffusion";
    if (t.includes("photosynthesis")) return "photosynthesis";
    if (t.includes("respiration")) return "respiration";
    if (t.includes("mitosis") || t.includes("meiosis") || t.includes("cell division")) return "cell_division";
    if (t.includes("genetics") || t.includes("inheritance") || t.includes("dna") || t.includes("allele") || t.includes("genotype")) return "genetics";
    return "general";
  }

  // Physics
  if (subject === "physics") {
    if (t.includes("velocity") || t.includes("speed") || t.includes("acceleration") || t.includes("distance") || t.includes("time")) {
      return "motion_speed_velocity";
    }
    if (t.includes("newton") || t.includes("force") || t.includes("mass") || t.includes("inertia")) return "newton_laws";
    if (
      t.includes("current") ||
      t.includes("voltage") ||
      t.includes("potential difference") ||
      t.includes("resistance") ||
      t.includes("ohm") ||
      t.includes("circuit")
    ) {
      return "electricity";
    }
    return "general";
  }

  // Chemistry
  if (subject === "chemistry") {
    if (t.includes("acid") || t.includes("base") || t.includes("alkali") || t.includes("ph")) return "acids_bases";
    if (t.includes("mole") || t.includes("molar") || t.includes("stoichiometry") || t.includes("molar mass")) return "moles_stoichiometry";
    if (t.includes("periodic") || t.includes("group") || t.includes("period") || t.includes("element")) return "periodic_table";
    return "general";
  }

  // Commerce
  if (subject === "commerce") {
    if (t.includes("demand") || t.includes("supply") || t.includes("price") || t.includes("market")) return "supply_demand";
    return "general";
  }

  // Bookkeeping
  if (subject === "bookkeeping") {
    if (t.includes("debit") || t.includes("credit") || t.includes("dr") || t.includes("cr") || t.includes("journal") || t.includes("ledger")) {
      return "accounting_drcr";
    }
    return "general";
  }

  // Computer Studies
  if (subject === "computer studies") {
    if (t.includes("network") || t.includes("lan") || t.includes("wan") || t.includes("internet") || t.includes("router")) return "computer_networks";
    if (t.includes("database") || t.includes("dbms") || t.includes("table") || t.includes("sql")) return "computer_databases";
    return "general";
  }

  return "general";
}

/**
 * Topic keyword bank:
 * - Adds strong topic anchors for evaluation.
 * - Each entry is groups of acceptable alternatives.
 * - Keep short (MVP): 4–8 groups max.
 */
function topicKeywordBank(topic: TopicId): KeywordGroup[] {
  switch (topic) {
    case "osmosis":
      return [
        ["water"],
        ["movement", "diffusion"],
        ["membrane", "semi-permeable", "selectively permeable"],
        ["concentration", "gradient", "from high to low", "from dilute to concentrated"],
      ];

    case "diffusion":
      return [
        ["movement"],
        ["particles", "molecules"],
        ["high concentration", "low concentration", "concentration gradient"],
        ["random", "passive"],
      ];

    case "photosynthesis":
      return [
        ["chlorophyll"],
        ["light", "sunlight"],
        ["carbon dioxide", "co2"],
        ["water", "h2o"],
        ["glucose", "carbohydrate"],
        ["oxygen", "o2"],
      ];

    case "respiration":
      return [
        ["glucose"],
        ["oxygen", "aerobic"],
        ["energy", "atp"],
        ["carbon dioxide"],
        ["water"],
      ];

    case "cell_division":
      return [
        ["mitosis", "meiosis"],
        ["chromosome"],
        ["nucleus", "nuclear"],
        ["stages", "prophase", "metaphase", "anaphase", "telophase"],
      ];

    case "genetics":
      return [
        ["dna", "gene"],
        ["allele"],
        ["genotype"],
        ["phenotype"],
        ["dominant", "recessive"],
      ];

    case "motion_speed_velocity":
      return [
        ["speed", "velocity"],
        ["distance", "displacement"],
        ["time"],
        ["formula", "v=d/t", "speed = distance/time"],
        ["units", "m/s", "km/h"],
      ];

    case "newton_laws":
      return [
        ["force"],
        ["mass"],
        ["acceleration"],
        ["newton", "law"],
        ["formula", "f=ma"],
      ];

    case "electricity":
      return [
        ["current", "i"],
        ["voltage", "potential difference", "v"],
        ["resistance", "r"],
        ["ohm", "ohm's law"],
        ["formula", "v=ir"],
        ["units", "ampere", "volt", "ohm"],
      ];

    case "acids_bases":
      return [
        ["acid", "base", "alkali"],
        ["ph"],
        ["indicator", "litmus"],
        ["hydrogen ions", "h+", "hydroxide ions", "oh-"],
      ];

    case "moles_stoichiometry":
      return [
        ["mole"],
        ["molar mass"],
        ["avogadro"],
        ["formula", "n=m/mr", "n=m/mm"],
        ["units", "mol", "g/mol"],
      ];

    case "periodic_table":
      return [
        ["group", "period"],
        ["atomic number"],
        ["valence", "outer electrons"],
        ["trend", "reactivity", "electronegativity"],
      ];

    case "supply_demand":
      return [
        ["demand"],
        ["supply"],
        ["price"],
        ["market"],
        ["increase", "decrease"],
      ];

    case "accounting_drcr":
      return [
        ["debit", "dr"],
        ["credit", "cr"],
        ["journal", "ledger"],
        ["entry", "posting"],
      ];

    case "computer_networks":
      return [
        ["network"],
        ["lan", "wan"],
        ["router", "switch"],
        ["internet"],
        ["protocol", "ip", "tcp"],
      ];

    case "computer_databases":
      return [
        ["database", "dbms"],
        ["table", "record", "field"],
        ["sql"],
        ["primary key"],
      ];

    default:
      return [];
  }
}

/**
 * Subject keyword bank (general, not topic-specific).
 * This remains as a backup if no topic is detected.
 */
function subjectKeywordBank(subjectRaw: string, qType: QType): KeywordGroup[] {
  const subject = normalise(subjectRaw);

  const common: KeywordGroup[] = [["example", "for example", "e.g."]];

  if (["english", "french", "arabic"].includes(subject)) {
    if (qType === "essay") return [...common, ["introduction", "intro"], ["conclusion", "conclude"], ["because", "therefore"]];
    if (qType === "compare") return [...common, ["whereas", "however", "on the other hand"], ["difference", "different"]];
    return [...common, ["because", "therefore"]];
  }

  if (subject === "kiswahili") {
    return [
      ["mfano", "kwa mfano"],
      ["kwa sababu", "hivyo", "kwa hiyo"],
    ];
  }

  if (subject === "basic mathematics" || subject === "mathematics") {
    if (qType === "calculation") return [...common, ["formula", "method"], ["step", "first"], ["answer", "="]];
    if (qType === "definition") return [...common, ["is", "means"]];
    return [...common, ["rule", "because"]];
  }

  if (subject === "biology") {
    if (qType === "definition") {
      return [
        ["process", "movement"],
        ["membrane", "selectively permeable", "semi-permeable"],
        ["concentration", "gradient", "from high to low"],
      ];
    }
    return [
      ["process", "steps", "stage"],
      ["because", "therefore"],
      ["example", "for example"],
    ];
  }

  if (subject === "chemistry") {
    if (qType === "calculation") {
      return [
        ["formula", "equation"],
        ["units", "unit"],
        ["substitute", "substitution", "put in values"],
      ];
    }
    return [
      ["equation", "reaction"],
      ["because", "therefore"],
      ["example", "for example"],
    ];
  }

  if (subject === "physics") {
    if (qType === "calculation") {
      return [
        ["formula", "equation"],
        ["units", "unit"],
        ["substitute", "substitution", "put in values"],
      ];
    }
    return [
      ["because", "therefore"],
      ["example", "for example"],
      ["unit", "units"],
    ];
  }

  if (subject === "history") {
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

  return common;
}

/**
 * Follow-up question + expected keyword groups:
 * - We combine: prompt structure groups + (topic bank if detected) + subject bank.
 * - Cap groups so it stays passable.
 */
function makeFollowUp(level: Level, subjectRaw: string, userQuestion: string) {
  const subject = normalise(subjectRaw);
  const qType = classifyQuestionType(userQuestion);
  const isACSEE = level === "ACSEE";
  const tighten = (q: string) => (isACSEE ? `${q} (Be precise and concise.)` : q);

  const topic = detectTopic(subjectRaw, userQuestion);

  let followupQuestion = tighten("In one or two sentences, restate the main idea in your own words.");
  let structureGroups: KeywordGroup[] = [["because", "therefore"], ["example", "for example"]];

  // Prompts (short)
  if (subject === "biology") {
    if (topic === "photosynthesis") {
      followupQuestion = tighten("Write the word equation for photosynthesis and state TWO conditions required.");
      structureGroups = [["equation", "->", "plus"], ["conditions", "light", "chlorophyll"]];
    } else if (topic === "osmosis") {
      followupQuestion = tighten("Define osmosis and mention the role of a semi-permeable membrane.");
      structureGroups = [["define", "is", "means"], ["membrane", "semi-permeable"]];
    } else if (qType === "explain") {
      followupQuestion = tighten("List the steps (Step 1, Step 2, Step 3) and give ONE example.");
      structureGroups = [["step", "1"], ["step", "2"], ["step", "3"], ["example", "for example"]];
    }
  } else if (subject === "physics" && topic === "motion_speed_velocity") {
    followupQuestion = tighten("State the formula for speed/velocity, include units, then show ONE substitution step.");
    structureGroups = [["formula", "v=d/t", "speed = distance/time"], ["units", "m/s", "km/h"], ["substitute", "substitution"]];
  } else if (subject === "chemistry" && topic === "acids_bases") {
    followupQuestion = tighten("State how acids and bases affect litmus, and mention pH for each.");
    structureGroups = [["litmus"], ["ph"], ["acid", "base", "alkali"]];
  } else if (subject === "bookkeeping" && topic === "accounting_drcr") {
    followupQuestion = tighten("Write the correct Dr/Cr entry for the transaction and explain why.");
    structureGroups = [["dr", "debit"], ["cr", "credit"], ["because", "therefore"]];
  }

  const topicGroups = topicKeywordBank(topic);
  const subjectGroups = subjectKeywordBank(subjectRaw, qType);

  const merged = [...structureGroups, ...topicGroups, ...subjectGroups];

  const seen = new Set<string>();
  const expectedGroups: KeywordGroup[] = [];
  for (const g of merged) {
    const key = g.map(normalise).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    expectedGroups.push(g);
    if (expectedGroups.length >= 9) break; // cap for MVP
  }

  return { followupQuestion, expectedGroups, qType, topic };
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
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, messages, loopState }));
    } catch {}
  }, [settings, messages, loopState]);

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
      reader.onload = () => setFilePreview(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function addMessage(role: ChatRole, content: string, imageDataUrl?: string) {
    setMessages((prev) => [...prev, { id: uid(), role, content, imageDataUrl, createdAt: Date.now() }]);
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

    const { followupQuestion, expectedGroups, qType, topic } = makeFollowUp(settings.level, settings.subject, userText);

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
      topic,
    });
  }

  function formatGroup(g: KeywordGroup) {
    return g[0];
  }

  function evaluateFollowUpAnswer(answer: string, state: Extract<LoopState, { status: "awaiting_followup_answer" }>) {
    // Optional: improve topic detection using the follow-up answer too (tiny boost)
    const boostedTopic = state.topic === "general" ? detectTopic(state.subject, `${state.originalQuestion} ${answer}`) : state.topic;
    const boostedGroups =
      boostedTopic === state.topic ? state.expectedGroups : [...topicKeywordBank(boostedTopic), ...state.expectedGroups].slice(0, 10);

    const { score, satisfied, missing } = scoreGroups(answer, boostedGroups);

    const verdict = score >= 0.7 ? "Correct" : score >= 0.4 ? "Partly correct" : "Incorrect";

    const includedHints = satisfied.slice(0, 4).map(formatGroup).join(", ");
    const missingHints = missing.slice(0, 4).map(formatGroup).join(", ");

    const topicLabel = boostedTopic !== "general" ? `Detected topic: ${boostedTopic}` : "Detected topic: general";

    addMessage(
      "bot",
      `${verdict}.\n\n${topicLabel}\n\nIncluded (detected): ${includedHints || "—"}\nMissing (suggested): ${missingHints || "—"}`
    );

    if (verdict === "Correct") {
      setLoopState({ status: "idle" });
      return;
    }

    if (state.triesLeft > 0) {
      addMessage("bot", `Try again (one more attempt):\n${state.followupQuestion}`);
      setLoopState({ ...state, triesLeft: state.triesLeft - 1, topic: boostedTopic, expectedGroups: boostedGroups });
      return;
    }

    addMessage(
      "bot",
      `Model outline (prototype):\n- Use ${state.subject} exam structure.\n- Try to include: ${boostedGroups
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
                    onChange={(e) => setSettings((s) => ({ ...s, level: e.target.value as Settings["level"] }))}
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

              <p className="text-xs text-slate-500">Tiny topic detector enables stronger keyword evaluation (MVP).</p>
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
                    <button type="button" className="text-slate-600 hover:text-slate-900 underline" onClick={clearAttachment}>
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
