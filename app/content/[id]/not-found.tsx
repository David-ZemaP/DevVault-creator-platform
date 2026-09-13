import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function ContentNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <FileQuestion aria-hidden="true" className="mx-auto h-10 w-10 text-zinc-600" />
      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Publication not found</h1>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        This publication is unavailable. Explore the latest projects and stories in the marketplace.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-9 items-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-4 text-xs font-medium transition-colors"
      >
        Back to Explore
      </Link>
    </div>
  );
}
