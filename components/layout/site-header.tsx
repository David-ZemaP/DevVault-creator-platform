import Link from "next/link";
import { MainNavigation } from "./main-navigation";
import { CustomConnectButton } from "@/components/wallet/connect-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="DevVault home"
          className="group flex shrink-0 items-center gap-3 text-lg font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-blue-500/20 ring-1 ring-white/15 transition-transform duration-200 group-hover:scale-105">
            DV
          </div>
          <span className="font-semibold tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors">
            DevVault
          </span>
        </Link>
        <div className="order-last w-full md:order-none md:w-auto">
          <MainNavigation />
        </div>
        <div className="min-w-0 max-w-full">
          <CustomConnectButton />
        </div>
      </div>
    </header>
  );
}
