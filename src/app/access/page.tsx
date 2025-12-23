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

      // success: cookie set by server
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
            Your school provides an official access code for KIUL Exam Companion.
            Enter it below to start revision.
          </p>

          <div className="mt-8">
            <label className="block text-sm font-semibold text-slate-700">
              Access code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., KIUL-MIKOCHENI-2026"
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
              {loading ? "Checking..." : "Continue"}
            </button>

            <p className="mt-4 text-sm text-slate-500">
              Don’t have a code? Visit{" "}
              <Link href="/licensing" className="text-blue-600 hover:underline font-medium">
                Licensing &amp; Access
              </Link>{" "}
              to request a school pilot or licence.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
