import "./globals.css";
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
      </body>
    </html>
  );
}
