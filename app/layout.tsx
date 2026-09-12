import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/wallet/web3-provider";
import { SiteHeader } from "@/components/layout/site-header";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "DevVault — Independent creators, shared knowledge",
    template: "%s | DevVault",
  },
  description:
    "Discover independent creators, verify content proofs on Avalanche Fuji, and manage token-gated memberships on HashKey Chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-700 selection:text-white">
        <a
          href="#main-content"
          className="sr-only fixed top-3 left-3 z-[100] rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Skip to content
        </a>
        <Web3Provider>
          <SiteHeader />
          <div className="border-b border-slate-800/60 bg-slate-900/25">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-slate-400 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  DUAL-CHAIN
                </span>
                <span>Content proofs on Avalanche Fuji (43113) · Memberships gated via Unlock on HashKey Chain (133)</span>
              </div>
            </div>
          </div>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-6 sm:py-12 lg:px-8"
          >
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-slate-950/60">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
              <span>DevVault · Independent creator platform & provenance</span>
              <div className="flex items-center gap-4">
                <Link href="/docs" className="hover:text-blue-400 transition-colors">
                  API Docs (Swagger)
                </Link>
                <span>·</span>
                <span className="text-slate-500">HashKey Chain & Avalanche Fuji</span>
              </div>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
