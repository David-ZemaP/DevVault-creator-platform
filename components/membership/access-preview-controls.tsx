import Link from "next/link";
import { cn } from "@/lib/utils";

interface AccessPreviewControlsProps {
  publicationId: string;
  isUnlocked: boolean;
}

export function AccessPreviewControls({ publicationId, isUnlocked }: AccessPreviewControlsProps) {
  if (process.env.NODE_ENV !== "development") return null;

  const contentPath = `/content/${encodeURIComponent(publicationId)}`;
  const scenarios = [
    { label: "Locked", href: contentPath, active: !isUnlocked },
    { label: "Unlocked", href: `${contentPath}?previewAccess=unlocked`, active: isUnlocked },
  ];

  return (
    <aside aria-label="Development access preview" className="border-y border-zinc-800/80 py-3">
      <p className="text-xs font-medium text-zinc-300">Development preview · Fictional content</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Choose a visual state. This does not purchase or verify a membership.
      </p>
      <nav aria-label="Access preview state" className="mt-2 flex flex-wrap gap-3">
        {scenarios.map(({ label, href, active }) => (
          <Link
            key={label}
            href={href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center text-xs underline underline-offset-4 transition-colors",
              active ? "font-semibold text-zinc-100" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
