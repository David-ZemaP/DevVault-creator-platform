import { Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MembershipOffer } from "@/types/publication";

interface LockedContentProps {
  creatorName: string;
  membership: MembershipOffer;
}

export function LockedContent({ creatorName, membership }: LockedContentProps) {
  return (
    <section aria-labelledby="membership-title" className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
        <LockKeyhole aria-hidden="true" className="h-6 w-6" />
      </span>
      <p className="mt-5 text-xs font-semibold tracking-wider text-blue-400 uppercase">Gated Publication</p>
      <h2 id="membership-title" className="mt-2 text-2xl font-bold tracking-tight text-white">Full Content & Assets</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">Join to unlock {creatorName}’s full content and verifiable updates.</p>
      <ul className="mt-6 space-y-3 text-sm text-slate-300">
        <li className="flex items-start gap-2.5">
          <Check aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
          <span>Full publication and source access</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Check aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
          <span>{membership.durationDays} days of continuous membership</span>
        </li>
      </ul>
      <div className="mt-8 border-t border-slate-800/80 pt-6">
        <p className="text-3xl font-extrabold text-white">
          {membership.price} <span className="text-base font-semibold text-slate-400">{membership.currency}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">Duration: {membership.durationDays} days · HashKey Chain</p>
      </div>
      <Button disabled aria-describedby="subscribe-availability" className="mt-6 w-full" size="lg">
        Membership Locked
      </Button>
      <p id="subscribe-availability" className="mt-3 text-xs leading-relaxed text-slate-400 text-center">
        Token-gating managed via Unlock Protocol smart locks on HashKey Testnet.
      </p>
    </section>
  );
}
