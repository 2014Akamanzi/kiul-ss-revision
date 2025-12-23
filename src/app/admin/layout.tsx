import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top admin navigation */}
      <header className="mx-auto max-w-5xl px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Admin content */}
      <main className="mx-auto max-w-5xl px-6 pb-12">
        {children}
      </main>
    </div>
  );
}
