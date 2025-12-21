import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            KIUL · Exam Companion
          </p>
          <span className="text-xs font-semibold text-slate-500">MVP</span>
        </div>

        {/* Hero */}
        <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8 sm:p-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Revise smarter for CSEE and ACSEE
            </h1>

            <p className="mt-4 text-slate-600 text-lg">
              A focused space to revise for{" "}
              <span className="font-semibold">CSEE (Form IV)</span> and{" "}
              <span className="font-semibold">ACSEE (Form VI)</span>. Ask
              questions, get clear explanations, and practise with follow-ups.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition"
              >
                Ask KIUL Bot
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Start revision now
              </Link>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Tip: Choose your <span className="font-semibold">Level</span> and{" "}
              <span className="font-semibold">Subject</span> inside the chat for
              focused revision.
            </p>
          </div>

          {/* How it works */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="font-semibold text-slate-900">1) Ask</p>
              <p className="mt-2 text-sm text-slate-600">
                Type a question or upload an image of an exam question.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="font-semibold text-slate-900">2) Learn</p>
              <p className="mt-2 text-sm text-slate-600">
                Get clear explanations aligned with your level and subject.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="font-semibold text-slate-900">3) Practise</p>
              <p className="mt-2 text-sm text-slate-600">
                Use Study Loop to answer follow-up questions and improve.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500">
            <span>KIUL Exam Companion MVP</span>
            <span>CSEE (Form IV) · ACSEE (Form VI)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
