import type { ReactNode } from "react";

export const inputClassName = "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-base text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60";

export function FormField({ id, label, children, error, hint }: { id: string; label: string; children: ReactNode; error?: string; hint?: string }) {
  return <div className="space-y-2"><label htmlFor={id} className="block text-sm font-medium text-neutral-300">{label}</label>{hint && <p id={`${id}-hint`} className="text-sm text-neutral-400">{hint}</p>}{children}{error && <p id={`${id}-error`} className="text-sm text-red-300">{error}</p>}</div>;
}
