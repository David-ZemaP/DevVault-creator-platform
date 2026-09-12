import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function ContentNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <FileQuestion aria-hidden="true" className="mx-auto h-10 w-10 text-neutral-500" />
      <h1 className="mt-5 text-3xl font-semibold text-white">Publication not found</h1>
      <p className="mt-3 text-base leading-relaxed text-neutral-400">This publication is unavailable. Explore the latest stories to find something to read.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">Back to Explore</Link>
    </div>
  );
}
