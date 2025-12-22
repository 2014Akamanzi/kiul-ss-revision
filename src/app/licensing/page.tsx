import Link from "next/link";

export default function LicensingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            ← Back to Home
          </Link>

          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-slate-900">
            Licensing & Access
          </h1>

          <p className="mt-3 text-slate-600 text-lg max-w-2xl">
            KIUL Exam Companion – School Edition
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white shadow-xl border border-slate-200 p-8 sm:p-12 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Institutional Access
            </h2>
            <p className="text-slate-600 leading-relaxed">
              KIUL Exam Companion is an academic support system developed to
              assist secondary schools in strengthening teaching and learning
              outcomes for <strong>CSEE (Form IV)</strong> and{" "}
              <strong>ACSEE (Form VI)</strong>.
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Access to the system is provided through institutional licensing,
              in partnership with participating schools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              How Access Works
            </h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>School-wide licence agreement</li>
              <li>Approved pilot programme</li>
              <li>Authorisation by school administration</li>
            </ul>
            <p className="mt-3 text-slate-600">
              Individual student access is activated only after school approval.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              What the Licence Covers
            </h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Access for authorised students and teachers</li>
              <li>Multiple subjects aligned with the NECTA syllabus</li>
              <li>Continuous system improvements during the licence period</li>
              <li>Ethical and responsible use of AI in learning</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Pilot Programme
            </h2>
            <p className="text-slate-600 leading-relaxed">
              KIUL offers a limited pilot programme for selected schools. The
              pilot allows schools to evaluate the system during one academic
              term and decide on long-term adoption without obligation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Important Notice
            </h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>The system does not replace teachers</li>
              <li>The system does not predict examination questions</li>
              <li>The system does not guarantee examination results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Enquiries & Partnerships
            </h2>
            <p className="text-slate-600">
              For licensing enquiries, pilot programme requests, or institutional
              partnerships, please contact:
            </p>

            <p className="mt-3 text-slate-700 font-medium">
              Katoki Institute of Ubuntu Leadership (KIUL)
            </p>

            <p className="text-slate-600">
              Email:{" "}
              <a
                href="mailto:info.kiul@katokifoundation.org"
                className="text-blue-600 hover:underline"
              >
                info.kiul@katokifoundation.org
              </a>
            </p>

            <p className="text-slate-600">
              WhatsApp:{" "}
              <a
                href="https://wa.me/255758624863"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                +255 758 624 863
              </a>
            </p>

            <p className="mt-1 text-slate-600">
              Website: https://revision.katokifoundation.org
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
