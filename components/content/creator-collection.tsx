"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { demoPublications, getServerPublications } from "@/features/demo/publishing";
import { loadCreatorPublications, creatorMetrics, type ResourceScenario } from "@/features/demo/creator-data";
import { listPublications, type PublicationSummary } from "@/features/publications/repository";
import { PublicationList } from "./publication-list";
import { DemoPublicationCard } from "./demo-publications";
import { Button } from "@/components/ui/button";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { errorMessage } from "@/lib/web3/errors";

export function CreatorCollection({ address, showScenarios = false }: { address: string; showScenarios?: boolean }) {
  const local = useSyncExternalStore(demoPublications.subscribe, demoPublications.getSnapshot, getServerPublications);
  const [scenario, setScenario] = useState<ResourceScenario>("success");
  const [request, setRequest] = useState(0);
  const [resource, setResource] = useState<{ address: string; items: readonly PublicationSummary[]; error?: string }>({ address, items: listPublications(address) });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!showScenarios) return;
    let active = true;
    loadCreatorPublications(address, scenario).then((items) => { if (active) { setResource({ address, items }); setLoading(false); } }).catch((cause: unknown) => { if (active) { setResource({ address, items: [], error: errorMessage(cause) }); setLoading(false); } });
    return () => { active = false; };
  }, [address, scenario, request, showScenarios]);
  const items = resource.address === address ? resource.items : listPublications(address);
  const publications = process.env.NODE_ENV === "development" && scenario !== "empty" ? local.filter((item) => item.creatorAddress.toLowerCase() === address.toLowerCase()) : [];
  const stats = scenario === "empty" ? { members: 0, revenue: "0.00" } : creatorMetrics(address);
  return <section className="space-y-6" aria-label="Creator publications">
    {showScenarios && <FormField id="collection-scenario" label="Dashboard demo scenario"><select id="collection-scenario" className={inputClassName} value={scenario} onChange={(e) => { setLoading(true); setScenario(e.target.value as ResourceScenario); }}><option value="success">Success</option><option value="loading">Loading</option><option value="error">Read error</option><option value="empty">Empty creator</option></select></FormField>}
    {loading ? <p role="status" className="rounded-xl border border-neutral-800 p-6 text-neutral-400">Loading publications…</p> : resource.error ? <div role="alert" className="space-y-4 rounded-xl border border-red-400/30 p-6"><p className="text-red-300">{resource.error}</p><Button size="lg" onClick={() => { setLoading(true); setScenario("success"); setRequest(request + 1); }}>Retry publications</Button></div> : <>
      <p className="text-sm text-neutral-400">Demo statistics · Fictional values, not on-chain analytics</p>
      <dl className="grid gap-4 sm:grid-cols-3">{[["Publications", items.length + publications.length], ["Mock members", stats.members], ["Mock revenue", `${stats.revenue} DEMO`]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-neutral-800 p-5"><dt className="text-sm text-neutral-400">{label}</dt><dd className="mt-2 break-words text-2xl font-semibold text-white">{value}</dd></div>)}</dl>
      <h2 className="text-xl font-semibold text-white">Publications</h2>
      {publications.map((publication) => <DemoPublicationCard key={publication.id} publication={publication} />)}
      {items.length > 0 ? <PublicationList publications={items} /> : publications.length === 0 ? <p className="rounded-xl border border-neutral-800 p-6 text-neutral-400">No publications yet. This creator is preparing their first story.</p> : null}
    </>}
  </section>;
}
