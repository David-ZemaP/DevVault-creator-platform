import { LockKeyholeOpen } from "lucide-react";
import type { PremiumContent } from "@/types/publication";

interface UnlockedContentProps {
  content: PremiumContent;
}

export function UnlockedContent({ content }: UnlockedContentProps) {
  return (
    <section aria-labelledby="unlocked-content-heading" className="space-y-6 border-t border-neutral-800 py-8">
      <div className="flex items-start gap-3 text-emerald-300" role="status">
        <LockKeyholeOpen aria-hidden="true" className="mt-1 h-6 w-6 shrink-0" />
        <div>
          <h2 id="unlocked-content-heading" className="text-xl font-semibold tracking-tight">
            CONTENT UNLOCKED
          </h2>
          <p className="mt-1 text-sm text-neutral-400">Demo access · No membership verified</p>
        </div>
      </div>
      <div className="space-y-5 text-lg leading-loose text-neutral-300">
        {content.body.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={`${content.publicationId}-${index}`} className="whitespace-pre-line">{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
