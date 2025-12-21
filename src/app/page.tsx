import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
              <span className="text-slate-900 font-bold">KIUL</span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Katoki Institute of Ubuntu Leadership
              </p>
              <p className="text-base font-semibold text-slate-800">KIUL Exam Companion</p>
            </div>
          </div>

          {/* No “MVP” badge */}
          <span className="text-xs font-semibold text-slate-500">&nbsp;</span>
        </div>

        {/* Hero card */}
        <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-xl p-8 sm:p-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-semibold text-slate-900 leading-tight">
              Revise smarter for <span className="text-slate-900">CSEE</span> and{" "}
              <span className="text-slate-900">ACSEE</span>
            </h1>

            <p className="mt-5 text-slate-600 text-base sm:text-lg leading-relaxed">
              A focused space to revise for <span className="font-semibold">CSEE (Form IV)</span> and{" "}
              <span className="font-semibold">ACSEE (Form VI)</span>. Ask questions, get clear explanations,
              and practise with follow-ups — grounded in Ubuntu values of guidance, patience, and growth.
            </p>

            {/* CTA row */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition"
              >
                Ask KIUL Bot
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-slate-800 font-semibold hover:bg-slate-50 transition"
              >
                Start revision now
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Tip: Choose your <span className="font-semibold">Level</span> and <span className="font-semibold">Subject</span> inside the chat for focused revision.
            </p>
          </div>

          {/* 3 cards */}
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-slate-900 font-semibold">1) Ask</h3>
              <p className="mt-2 text-sm text-slate-600">
                Type a question or upload an image of an exam question.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-slate-900 font-semibold">2) Learn</h3>
              <p className="mt-2 text-sm text-slate-600">
                Get clear explanations aligned with your level and subject.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-slate-900 font-semibold">3) Practise</h3>
              <p className="mt-2 text-sm text-slate-600">
                Use Study Loop to answer follow-up questions and improve steadily.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-500">
            <span>KIUL Exam Companion</span>
            <span>CSEE (Form IV) · ACSEE (Form VI)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
