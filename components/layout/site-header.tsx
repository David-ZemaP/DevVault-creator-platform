import Link from "next/link";
import { MainNavigation } from "./main-navigation";
import { CustomConnectButton } from "@/components/wallet/connect-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="DevVault home" className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-white">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 font-mono text-sm">DV</span>
          DevVault
        </Link>
        <div className="order-last w-full md:order-none md:w-auto"><MainNavigation /></div>
        <div className="min-w-0 max-w-full"><CustomConnectButton /></div>
      </div>
    </header>
  );
}
