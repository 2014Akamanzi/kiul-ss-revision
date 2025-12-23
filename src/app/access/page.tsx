"use client";

import Link from "next/link";
import { useState } from "react";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Invalid access code.");
        setLoading(false);
        return;
      }

      window.location.href = "/chat";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl border border-slate-200 p-8 sm:p-12 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Enter School Access Code
          </h1>

          <p className="mt-3 text-slate-600">
            KIUL Exam Companion is provided through licensed school access. Enter the official
            access code provided by your school to start revision.
          </p>

          <div className="mt-8">
            <label className="block text-sm font-semibold text-slate-700">
              Access code
            </label>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., KIUL-PILOT-001"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!code.trim() || loading}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Enter learning space"}
            </button>

            <div className="mt-5 text-sm text-slate-600">
              <p className="text-slate-500">
                Don’t have a code? Request school access via{" "}
                <Link href="/licensing" className="text-blue-600 hover:underline font-medium">
                  Licensing &amp; Access
                </Link>
                .
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">Enquiries & partnerships</p>
              <p className="mt-1 text-slate-600">
                Email:{" "}
                <a
                  href="mailto:info.kiul@katokifoundation.org"
                  className="text-blue-600 hover:underline font-medium"
                >
                  info.kiul@katokifoundation.org
                </a>
              </p>
              <p className="text-slate-600">
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
        </div>
      </div>
    </main>
  );
}
