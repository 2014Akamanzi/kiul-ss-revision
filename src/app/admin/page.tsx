"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccessCode = {
  id: string;
  code: string;
  schoolName: string | null;
  allowedLevels: string[];
  status: string;
  createdAt: string;
};

export default function AdminHome() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [allowedLevels, setAllowedLevels] = useState<string>("CSEE,ACSEE");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/access-codes", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load codes");
      setCodes(data.codes || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCode() {
    setErr(null);
    try {
      const levels = allowedLevels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          schoolName,
          allowedLevels: levels,
          status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create code");

      setCode("");
      setSchoolName("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to create code");
    }
  }

  async function disable(id: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/access-codes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to disable code");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to disable code");
    }
  }

  const activeCount = useMemo(
    () => codes.filter((c) => c.status === "ACTIVE").length,
    [codes]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
            ← Back to Home
          </Link>

          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white shadow-xl border border-slate-200 p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            KIUL Admin · Access Codes
          </h1>
          <p className="mt-2 text-slate-600">
            Active codes: <span className="font-semibold">{activeCount}</span>
          </p>

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code (e.g., KIUL-PILOT-002)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="School name (optional)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              value={allowedLevels}
              onChange={(e) => setAllowedLevels(e.target.value)}
              placeholder="Allowed levels (comma-separated)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="mt-3">
            <button
              onClick={createCode}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
            >
              Create code
            </button>

            <button
              onClick={load}
              className="ml-3 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Codes</h2>
              {loading && <span className="text-xs text-slate-500">Loading…</span>}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3">Levels</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {codes.map((c) => (
                    <tr key={c.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.code}</td>
                      <td className="px-4 py-3 text-slate-700">{c.schoolName || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {(c.allowedLevels || []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{c.status}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => disable(c.id)}
                          disabled={c.status !== "ACTIVE"}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                          Disable
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && codes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No codes yet. Create one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Admin page URL: <span className="font-semibold">/admin</span> (after logging in at{" "}
              <span className="font-semibold">/admin/login</span>).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
