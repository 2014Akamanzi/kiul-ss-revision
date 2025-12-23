import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl border border-slate-200 p-8 sm:p-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
            How KIUL works
          </h1>

          <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-3xl">
            KIUL Exam Companion is designed for secondary schools to support
            revision for <span className="font-semibold">CSEE (Form IV)</span> and{" "}
            <span className="font-semibold">ACSEE (Form VI)</span>. The system is
            school-based: KIUL works with schools, and schools grant access to
            their students and teachers.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                1) School partnership
              </h2>
              <p className="mt-2 text-slate-600">
                A school contacts KIUL for a pilot or licence. KIUL and the
                school agree on the period (term or year) and the levels
                (CSEE and/or ACSEE).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                2) Access code issued
              </h2>
              <p className="mt-2 text-slate-600">
                KIUL provides the school with an official access code. The
                school shares the code with authorised students and teachers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                3) Students revise
              </h2>
              <p className="mt-2 text-slate-600">
                Students open the app and click <span className="font-semibold">Start revision</span>.
                They enter the school access code, choose level and subject, then
                ask questions (including by uploading images).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                4) Clear explanations + practice
              </h2>
              <p className="mt-2 text-slate-600">
                KIUL responds with exam-oriented explanations and, where helpful,
                a short follow-up question to strengthen understanding (Study Loop).
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Enquiries & partnerships
            </h2>
            <p className="mt-2 text-slate-600">
              For school pilots, licensing, or partnerships:
            </p>

            <div className="mt-3 text-slate-700">
              <p>
                Email:{" "}
                <a
                  href="mailto:info.kiul@katokifoundation.org"
                  className="text-blue-600 hover:underline font-medium"
                >
                  info.kiul@katokifoundation.org
                </a>
              </p>
              <p>
                WhatsApp:{" "}
                <a
                  href="https://wa.me/255758624863"
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +255 758 624 863
                </a>
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/licensing"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Licensing &amp; Access
            </Link>

            <Link
              href="/access"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Start revision
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
