import { Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MembershipOffer } from "@/types/publication";

interface LockedContentProps {
  creatorName: string;
  membership: MembershipOffer;
}

export function LockedContent({ creatorName, membership }: LockedContentProps) {
  return (
    <section aria-labelledby="membership-title" className="rounded-2xl border border-red-400/20 bg-neutral-900/60 p-6 sm:p-8">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-red-400"><LockKeyhole aria-hidden="true" className="h-6 w-6" /></span>
      <p className="mt-5 text-xs font-semibold tracking-widest text-red-400 uppercase">Locked · Members only</p>
      <h2 id="membership-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">The full story is inside.</h2>
      <p className="mt-3 text-base leading-relaxed text-neutral-400">Become a member to read {creatorName}’s premium content.</p>
      <ul className="mt-6 space-y-3 text-sm text-neutral-300">
        <li className="flex items-start gap-2"><Check aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-500" />Full publication access</li>
        <li className="flex items-start gap-2"><Check aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-500" />{membership.durationDays} days of membership</li>
      </ul>
      <p className="mt-8 text-3xl font-semibold text-white">{membership.price} <span className="text-base font-medium text-neutral-400">{membership.currency}</span></p>
      <p className="mt-1 text-sm text-neutral-500">for {membership.durationDays} days · demo price</p>
      <Button disabled aria-describedby="subscribe-availability" className="mt-6 w-full" size="lg">Subscribe</Button>
      <p id="subscribe-availability" className="mt-3 text-sm leading-relaxed text-neutral-400">Subscriptions are not available in this preview. No payment will be requested.</p>
    </section>
  );
}
