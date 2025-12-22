import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "KIUL Exam Companion",
  description: "Revision support for CSEE and ACSEE students",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 antialiased flex flex-col">
        {/* Main content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
            <p>
              © {new Date().getFullYear()} Katoki Institute of Ubuntu Leadership
              (KIUL)
            </p>

            <div className="flex items-center gap-6">
              <Link
                href="/licensing"
                className="hover:text-blue-600 hover:underline font-medium"
              >
                Licensing & Access
              </Link>

              <a
                href="https://revision.katokifoundation.org"
                className="hover:text-blue-600 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                KIUL Exam Companion
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
