import Link from "next/link";

export default function CreatorNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-3xl font-semibold text-white">Creator not found</h1>
      <p className="mt-3 text-base text-neutral-400">There is no creator profile for this address in the demo.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">Explore creators</Link>
    </div>
  );
}
