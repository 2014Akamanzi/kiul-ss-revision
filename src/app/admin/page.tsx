"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AccessCode = {
  id: string;
  code: string;
  schoolName: string | null;
  allowedLevels: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [allowedLevels, setAllowedLevels] = useState("CSEE,ACSEE");

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/access-codes");
      if (!res.ok) throw new Error("Failed to load access codes");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(
    () => items.filter((x) => x.status === "ACTIVE").length,
    [items]
  );

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const res = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          schoolName: schoolName || null,
          allowedLevels: allowedLevels || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create code");

      setCode("");
      setSchoolName("");
      setAllowedLevels("CSEE,ACSEE");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to create");
    }
  }

  async function disable(id: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/access-codes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to disable");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to disable");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin · Access Codes</h1>
            <p className="mt-1 text-slate-600">
              Active codes: <span className="font-semibold">{activeCount}</span>
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>

        {err ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Create a new code</h2>
            <form onSubmit={createCode} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Code</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="KIUL-SCHOOL-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">School name (optional)</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Example Secondary School"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Allowed levels (comma-separated)
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  value={allowedLevels}
                  onChange={(e) => setAllowedLevels(e.target.value)}
                  placeholder="CSEE,ACSEE"
                />
              </div>

              <button
                type="submit"
                disabled={!code.trim()}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                Create code
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Existing codes</h2>
              <button
                onClick={load}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4">
              {loading ? (
                <p className="text-slate-600">Loading...</p>
              ) : items.length === 0 ? (
                <p className="text-slate-600">No access codes yet.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((x) => (
                    <div
                      key={x.id}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{x.code}</div>
                          <div className="text-sm text-slate-600">
                            {x.schoolName || "—"} · {x.allowedLevels || "—"} ·{" "}
                            <span className={x.status === "ACTIVE" ? "text-green-700" : "text-slate-500"}>
                              {x.status}
                            </span>
                          </div>
                        </div>

                        {x.status === "ACTIVE" ? (
                          <button
                            onClick={() => disable(x.id)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Disable
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
