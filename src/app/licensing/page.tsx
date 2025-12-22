import Link from "next/link";

export default function LicensingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-12 shadow-xl">
          <h1 className="text-5xl font-extrabold text-slate-900">
            Licensing &amp; Access
          </h1>

          <p className="mt-4 text-xl text-slate-600">
            KIUL Exam Companion – School Edition
          </p>

          <p className="mt-6 max-w-3xl text-slate-600">
            KIUL Exam Companion is available to schools through an institutional
            licensing model. Schools receive guided access for students,
            curriculum-aligned support, and teacher-facing evaluation tools.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {/* Email button */}
            <a
              href="mailto:info.kiul@katokifoundation.org?subject=KIUL%20School%20Pilot%20Request"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Request a School Pilot (Email)
            </a>

            {/* WhatsApp button — NOW BLUE */}
            <a
              href="https://wa.me/255758624863"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Request via WhatsApp
            </a>
          </div>

          {/* Footer note */}
          <div className="mt-12 text-sm text-slate-500">
            For partnerships and enquiries, contact{" "}
            <a
              href="mailto:info.kiul@katokifoundation.org"
              className="font-medium text-blue-600 hover:underline"
            >
              info.kiul@katokifoundation.org
            </a>{" "}
            or WhatsApp{" "}
            <span className="font-medium">+255 758 624 863</span>.
          </div>
        </div>
      </div>
    </main>
  );
}
