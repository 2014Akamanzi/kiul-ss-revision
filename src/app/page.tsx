import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            KIUL · Exam Companion
          </p>
          {/* (If you removed MVP earlier, keep it removed. If you still want it, add it back.) */}
        </div>

        {/* Main card */}
        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl border border-slate-200 p-8 sm:p-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight">
              Revise smarter for CSEE and ACSEE
            </h1>

            <p className="mt-5 text-slate-600 text-base sm:text-lg">
              A focused space to revise for{" "}
              <span className="font-semibold">CSEE (Form IV)</span> and{" "}
              <span className="font-semibold">ACSEE (Form VI)</span>. Ask questions, get
              clear explanations, and practise with follow-ups — grounded in Ubuntu values of
              guidance, patience, and growth.
            </p>

            {/* CTA row — ONLY CHANGE: add Licensing button next to Start revision */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition"
              >
                Start revision
              </Link>

              <Link
                href="/licensing"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition"
              >
                Licensing &amp; Access
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Tip: Choose your <span className="font-semibold">Level</span> and{" "}
              <span className="font-semibold">Subject</span> inside the chat for focused revision.
            </p>
          </div>

          {/* Optional: if your earlier version had the 3 feature cards, keep them */}
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900">1) Ask</h3>
              <p className="mt-1 text-sm text-slate-600">
                Type a question or upload an image of an exam question.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900">2) Learn</h3>
              <p className="mt-1 text-sm text-slate-600">
                Get clear explanations aligned with your level and subject.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900">3) Practise</h3>
              <p className="mt-1 text-sm text-slate-600">
                Use Study Loop to answer follow-up questions and improve.
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between text-sm text-slate-400">
            <span>KIUL Exam Companion</span>
            <span>CSEE (Form IV) · ACSEE (Form VI)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
