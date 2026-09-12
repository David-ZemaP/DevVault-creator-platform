import Link from "next/link";
import { UserX } from "lucide-react";

export default function CreatorNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <UserX aria-hidden="true" className="mx-auto h-12 w-12 text-slate-500" />
      <h1 className="mt-5 text-3xl font-extrabold text-white">Creator not found</h1>
      <p className="mt-3 text-base text-slate-400">There is no creator profile for this address in the demo.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-950/50 transition-all"
      >
        Explore creators
      </Link>
    </div>
  );
}
