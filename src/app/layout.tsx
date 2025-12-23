import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "KIUL Exam Companion",
  description: "Revision companion for CSEE and ACSEE students",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 antialiased">
        {children}

        {/* Footer */}
        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} Katoki Institute of Ubuntu Leadership (KIUL)
              </p>

              <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/licensing" className="text-slate-600 hover:text-slate-900">
                  Licensing &amp; Access
                </Link>
                <Link href="/how-it-works" className="text-slate-600 hover:text-slate-900">
                  How KIUL works
                </Link>

                {/* Admin entry point (small + discreet) */}
                <Link href="/admin/login" className="text-slate-400 hover:text-slate-700">
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
