import { describeReference, type ExplorerReference as Reference } from "@/lib/web3/explorers";
import { networkName } from "@/lib/web3/networks";

export function ExplorerReference({ reference }: { reference: Reference }) {
  const item = describeReference(reference);
  return <p className="break-all text-xs leading-relaxed text-neutral-400"><span className="font-medium">{item.label}</span> · {networkName(reference.chainId)}<br />{item.href ? <a className="inline-flex min-h-11 items-center text-red-300 underline" href={item.href} target="_blank" rel="noopener noreferrer">{item.value}</a> : <span className="font-mono">{item.value}</span>}</p>;
}
