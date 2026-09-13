'use client';
import { useEffect, useState } from 'react';
import { safeUrl } from '@/lib/marketplace/public';
interface Props { title: string; demoUrl?: string; demoVideoUrl?: string; projectType?: 'article' | 'software' }

export function SoftwareDemoRunner({ title, demoUrl, demoVideoUrl, projectType }: Props) {
  const live = safeUrl(demoUrl);
  const video = safeUrl(demoVideoUrl);
  const [hidden, setHidden] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    // Cross-origin frame blocking cannot be detected reliably, even from onLoad.
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [live]);
  if (projectType !== 'software' && !live && !video) return null;
  return <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4" aria-label="Live Demo">
    <h2 className="text-xl font-semibold text-white">Live Demo <span className="text-sm text-emerald-400">Public</span></h2>
    <p className="text-sm text-neutral-400">Explore {title} before purchasing its private source archive.</p>
    {live && <>
      <a href={live} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex rounded-lg bg-red-600 px-4 py-3 text-white">Open Live Demo ↗</a>
      {!hidden && <iframe src={live} title={`${title} — Live Demo`} sandbox="allow-scripts" referrerPolicy="no-referrer"
        allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'; usb 'none'"
        className="w-full h-96 rounded-lg border border-neutral-700" onError={() => setHidden(true)} />}
      <p className="text-sm text-neutral-400">Some demos block embedding or require a separate tab. Use Open Live Demo if the preview is blank.</p>
      {timedOut && !hidden && <p role="status">Preview not working? Open the demo in a new tab or hide the preview.</p>}
      <button type="button" className="text-sm text-neutral-300" onClick={() => setHidden(!hidden)}>{hidden ? 'Show embedded preview' : 'Hide embedded preview'}</button>
    </>}
    {video && <a href={video} target="_blank" rel="noopener noreferrer" className="ml-4 inline-flex text-red-400">Watch video demo ↗</a>}
    {!live && !video && <p className="text-sm text-neutral-500">The creator has not added a demo.</p>}
  </section>;
}
