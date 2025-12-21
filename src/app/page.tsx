import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center font-extrabold text-slate-800">
              KIUL
            </div>

            <div className="leading-tight">
              <p className="text-sm sm:text-base font-bold tracking-wide text-slate-700 uppercase">
                Katoki Institute of Ubuntu Leadership
              </p>
              <p className="text-sm font-semibold text-slate-600">KIUL Exam Companion</p>
            </div>
          </div>

          {/* MVP removed on purpose */}
        </div>

        {/* Hero card */}
        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl border border-slate-200 p-8 sm:p-12">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight">
            Revise smarter for <span className="text-blue-700">CSEE</span> and{" "}
            <span className="text-blue-700">ACSEE</span>
          </h1>

          <p className="mt-5 text-slate-600 text-base sm:text-lg max-w-3xl">
            A focused space to revise for <span className="font-semibold">CSEE (Form IV)</span> and{" "}
            <span className="font-semibold">ACSEE (Form VI)</span>. Ask questions, get clear
            explanations, and practise with follow-ups — grounded in Ubuntu values of guidance,
            patience, and growth.
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Ask KIUL Bot
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Start revision now
            </Link>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Tip: Choose your <span className="font-semibold">Level</span> and{" "}
            <span className="font-semibold">Subject</span> inside the chat for focused revision.
          </p>

          {/* How it works */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">1) Ask</h3>
              <p className="text-sm text-slate-600">
                Type a question or upload an image of an exam question.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">2) Learn</h3>
              <p className="text-sm text-slate-600">
                Get explanations aligned with your level and subject.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">3) Practise</h3>
              <p className="text-sm text-slate-600">
                Use Study Loop to answer follow-up questions and improve steadily.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-between text-sm text-slate-400">
            <span>KIUL Exam Companion</span>
            <span>CSEE (Form IV) · ACSEE (Form VI)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
