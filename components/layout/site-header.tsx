import Link from "next/link";
import Image from "next/image";
import logoImg from "@/public/assets/logo.png";
import { MainNavigation } from "./main-navigation";
import { CustomConnectButton } from "@/components/wallet/connect-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="DevVault home"
          className="group flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <Image
            src={logoImg}
            alt="DevVault"
            className="h-14 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
        <div className="order-last w-full md:order-none md:w-auto">
          <MainNavigation />
        </div>
        <div className="flex items-center gap-2.5 min-w-0 max-w-full">
          <ThemeToggle />
          <CustomConnectButton />
        </div>
      </div>
    </header>
  );
}
