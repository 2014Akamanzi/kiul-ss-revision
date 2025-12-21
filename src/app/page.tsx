import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <span className="text-base font-bold text-slate-900">KIUL</span>
            </div>
            <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
              Katoki Institute of Ubuntu Leadership
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-[2.5rem] bg-white shadow-xl border border-slate-200 p-10 sm:p-16">
          {/* Hero */}
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-7xl font-bold text-slate-900 leading-tight">
              Revise smarter for CSEE and ACSEE
            </h1>

            <p className="mt-6 text-slate-600 text-xl">
              A focused space to revise for{" "}
              <span className="font-semibold">CSEE (Form IV)</span> and{" "}
              <span className="font-semibold">ACSEE (Form VI)</span>. Ask questions,
              get clear explanations, and practise with follow-ups — grounded in
              Ubuntu values of guidance, patience, and growth.
            </p>

            {/* Actions */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition"
              >
                Ask KIUL Bot
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Start revision now
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Tip: Choose your <strong>Level</strong> and <strong>Subject</strong> inside the chat for focused revision.
            </p>
          </div>

          {/* How it works */}
          <div className="mt-20 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">1. Ask</h3>
              <p className="text-sm text-slate-600">
                Type a question or upload an image of an exam question.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">2. Learn</h3>
              <p className="text-sm text-slate-600">
                Get explanations aligned with your level and subject.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">3. Practise</h3>
              <p className="text-sm text-slate-600">
                Use Study Loop to answer follow-up questions and improve steadily.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 flex flex-col sm:flex-row justify-between text-sm text-slate-400">
            <span>KIUL Exam Companion</span>
            <span>CSEE (Form IV) · ACSEE (Form VI)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
