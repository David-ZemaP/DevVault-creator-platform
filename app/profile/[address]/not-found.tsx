import Link from "next/link";
import { UserX } from "lucide-react";

export default function CreatorNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <UserX aria-hidden="true" className="mx-auto h-10 w-10 text-zinc-600" />
      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Creator not found</h1>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">There is no creator profile for this address in the demo.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-9 items-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-4 text-xs font-medium transition-colors"
      >
        Explore creators
      </Link>
    </div>
  );
}
