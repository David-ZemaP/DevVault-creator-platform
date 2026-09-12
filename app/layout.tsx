import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/wallet/web3-provider";
import { CustomConnectButton } from "@/components/wallet/connect-button";
import Link from "next/link";
import { Sparkles, PlusCircle, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "DevVault Creator Platform",
  description: "Decentralized creator economy & content provenance on Avalanche",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-950 text-neutral-100 flex flex-col min-h-screen">
        <Web3Provider>
          <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-mono">
                    DV
                  </div>
                  <span>DevVault</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
                  <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Explore
                  </Link>
                  <Link href="/create" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    Create
                  </Link>
                  <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <CustomConnectButton />
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-neutral-800/60 py-6 text-center text-xs text-neutral-500">
            DevVault Creator Platform • Built with Next.js, Wagmi & Avalanche
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
