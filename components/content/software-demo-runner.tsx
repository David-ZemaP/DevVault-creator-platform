'use client';
import { useEffect, useState } from 'react';
import { safeUrl } from '@/lib/marketplace/public';
import { ExternalLink, PlayCircle, Code2 } from 'lucide-react';

interface Props {
  title: string;
  demoUrl?: string;
  demoVideoUrl?: string;
  demoPreviewCode?: string;
  projectType?: 'article' | 'software';
}

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

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none space-y-4" aria-label="Public demo">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Live Demo <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">Public</span></h2>
        </div>
        <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Public Access
        </span>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Test and explore {title} before purchasing its private source code archive.
      </p>

      {live && (
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={live}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors"
            >
              <span>Open Live Demo</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {video && (
              <a
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white transition-colors"
              >
                <PlayCircle className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Watch Video Demo</span>
              </a>
            )}
          </div>

          {!hidden && (
            <iframe
              src={live}
              title={`${title} — Live Demo`}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'; usb 'none'"
              className="w-full h-80 sm:h-96 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              onError={() => setHidden(true)}
            />
          )}

          <p className="text-[11px] text-zinc-500">
            Some demos block embedding or require a separate tab. Use Open Live Demo if the preview is blank.
          </p>

          {timedOut && !hidden && (
            <p role="status" className="text-xs text-zinc-600 dark:text-zinc-400">
              Preview not working? Open the demo in a new tab or hide the preview.
            </p>
          )}

          <div>
            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              onClick={() => setHidden(!hidden)}
            >
              {hidden ? 'Show embedded preview' : 'Hide embedded preview'}
            </button>
          </div>
        </div>
      )}

      {!live && video && (
        <a
          href={video}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white transition-colors"
        >
          <PlayCircle className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>Watch Video Demo</span>
        </a>
      )}

      {!live && !video && (
        <p className="text-xs text-zinc-500 italic">The creator has not attached an interactive demo link.</p>
      )}
    </section>
  );
}
