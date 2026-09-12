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
    <aside aria-label="Development access preview" className="border-y border-neutral-800 py-4">
      <p className="text-sm font-medium text-neutral-200">Development preview · Fictional content</p>
      <p className="mt-1 text-sm text-neutral-400">
        Choose a visual state. This does not purchase or verify a membership.
      </p>
      <nav aria-label="Access preview state" className="mt-2 flex flex-wrap gap-4">
        {scenarios.map(({ label, href, active }) => (
          <Link
            key={label}
            href={href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4",
              active ? "font-semibold text-red-300" : "text-neutral-400 hover:text-white",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
