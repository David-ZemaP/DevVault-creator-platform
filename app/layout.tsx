import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/wallet/web3-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { DemoSessionControls } from "@/components/wallet/demo-session-controls";

export const metadata: Metadata = {
  title: { default: "DevVault — Independent creators, shared knowledge", template: "%s | DevVault" },
  description: "Discover independent creators and preview premium publications. A membership platform in development for HashKey Chain and Avalanche Fuji.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 antialiased">
        <a href="#main-content" className="sr-only fixed top-3 left-3 z-[100] rounded-lg bg-white px-4 py-3 text-neutral-950 focus:not-sr-only">Skip to content</a>
        <Web3Provider>
          <SiteHeader />
          <div className="border-b border-neutral-800/60 bg-neutral-900/40">
            <p className="mx-auto max-w-7xl px-4 py-2.5 text-xs leading-relaxed text-neutral-400 sm:px-6 lg:px-8"><span className="mr-2 font-semibold text-red-300">DEMO PREVIEW</span>Sample creators and publications. Memberships and content proofs are not live.</p>
            {process.env.NODE_ENV === "development" && <DemoSessionControls />}
          </div>
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-6 sm:py-12 lg:px-8">{children}</main>
          <footer className="border-t border-neutral-800/60">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8"><span>DevVault · Made for independent creators</span><span>Ethereum Bolivia · Hackathon preview</span></div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
