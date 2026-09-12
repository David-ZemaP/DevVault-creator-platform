import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function ContentNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <FileQuestion aria-hidden="true" className="mx-auto h-10 w-10 text-zinc-600" />
      <h1 className="mt-4 text-2xl font-bold text-white">Publication not found</h1>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
        This publication is unavailable. Explore the latest projects and stories in the marketplace.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-9 items-center rounded-lg bg-zinc-100 px-4 text-xs font-medium text-zinc-900 hover:bg-white transition-colors"
      >
        Back to Explore
      </Link>
    </div>
  );
}
