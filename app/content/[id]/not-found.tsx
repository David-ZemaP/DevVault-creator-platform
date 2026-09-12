import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function ContentNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <FileQuestion aria-hidden="true" className="mx-auto h-12 w-12 text-slate-500" />
      <h1 className="mt-5 text-3xl font-extrabold text-white">Publication not found</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-400">
        This publication is unavailable. Explore the latest projects and stories in the marketplace.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-950/50 transition-all"
      >
        Back to Explore
      </Link>
    </div>
  );
}
