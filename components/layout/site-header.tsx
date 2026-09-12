import Link from "next/link";
import { MainNavigation } from "./main-navigation";
import { CustomConnectButton } from "@/components/wallet/connect-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="DevVault home"
          className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-zinc-200 shadow-sm transition-colors group-hover:border-zinc-700 group-hover:text-white">
            DV
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-200 transition-colors group-hover:text-white">
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
