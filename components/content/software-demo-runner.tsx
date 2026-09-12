import { safeUrl } from '@/lib/marketplace/public';
interface Props { title: string; demoUrl?: string; demoVideoUrl?: string; demoPreviewCode?: string; projectType?: 'article' | 'software' }
export function SoftwareDemoRunner({ title, demoUrl, demoVideoUrl, projectType }: Props) {
  const live = safeUrl(demoUrl), video = safeUrl(demoVideoUrl);
  if (projectType !== 'software' && !live && !video) return null;
  return <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4" aria-label="Public demo">
    <h2 className="text-xl font-semibold text-white">Demo <span className="text-sm text-emerald-400">Public</span></h2>
    <p className="text-sm text-neutral-400">Explore {title} before purchasing its private source archive.</p>
    {live && <a href={live} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-red-600 px-4 py-3 text-white">Open live demo ↗</a>}
    {video && <a href={video} target="_blank" rel="noopener noreferrer" className="ml-4 inline-flex text-red-400">Watch video demo ↗</a>}
    {!live && !video && <p className="text-sm text-neutral-500">The creator has not added a demo.</p>}
  </section>;
}
