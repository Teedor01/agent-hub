import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentHub — Find the right AI agent for your DeFi task",
  description: "Discovery, evaluation, trust, and hiring for AI agents on BNB Smart Chain.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold text-slate-900">
              Agent<span className="text-blue-600">Hub</span>
            </Link>
            <nav className="flex gap-5 text-sm text-slate-600">
              <Link href="/category/health-factor" className="hover:text-blue-600">Health Factor</Link>
              <Link href="/category/yield-optimization" className="hover:text-blue-600">Yield</Link>
              <Link href="/category/rebalancing" className="hover:text-blue-600">Rebalancing</Link>
              <Link href="/category/grid-trading" className="hover:text-blue-600">Grid Trading</Link>
              <Link href="/copilot" className="font-medium text-blue-600">Ask Copilot</Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
