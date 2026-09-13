import { Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MembershipOffer } from "@/types/publication";

interface LockedContentProps {
  creatorName: string;
  membership: MembershipOffer;
}

export function LockedContent({ creatorName, membership }: LockedContentProps) {
  return (
    <section aria-labelledby="membership-title" className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
          <LockKeyhole aria-hidden="true" className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">Gated Publication</p>
          <h2 id="membership-title" className="text-base font-semibold tracking-tight text-white">Full Content & Assets</h2>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-zinc-400">Join to unlock {creatorName}’s full content and verifiable updates.</p>

      <ul className="space-y-2 text-xs text-zinc-300 pt-1">
        <li className="flex items-center gap-2">
          <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>Full publication and source access</span>
        </li>
        <li className="flex items-center gap-2">
          <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>{membership.durationDays} days of continuous membership</span>
        </li>
      </ul>

      <div className="border-t border-zinc-800/80 pt-4">
        <p className="text-xl font-bold text-white">
          {membership.price} <span className="text-xs font-normal text-zinc-400">{membership.currency}</span>
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-500">Duration: {membership.durationDays} days · HashKey Chain</p>
      </div>

      <Button disabled aria-describedby="subscribe-availability" className="w-full" size="md">
        Membership Locked
      </Button>
      <p id="subscribe-availability" className="text-[11px] leading-relaxed text-zinc-500 text-center">
        Token-gating managed via Unlock Protocol smart locks on HashKey Testnet.
      </p>
    </section>
  );
}
