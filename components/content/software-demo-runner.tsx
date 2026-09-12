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
  const live = safeUrl(demoUrl), video = safeUrl(demoVideoUrl);
  if (projectType !== 'software' && !live && !video) return null;

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-3" aria-label="Public demo">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Interactive Demo & Preview</h2>
        </div>
        <span className="inline-flex items-center rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
          Public Access
        </span>
      </div>

      <p className="text-xs text-zinc-400">
        Test and explore {title} before purchasing its private source code archive.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {live && (
          <a
            href={live}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-blue-500 active:bg-blue-700 transition-colors"
          >
            <span>Open live demo</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {video && (
          <a
            href={video}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
          >
            <PlayCircle className="h-3.5 w-3.5 text-zinc-400" />
            <span>Watch Video Demo</span>
          </a>
        )}

        {!live && !video && (
          <p className="text-xs text-zinc-500 italic">The creator has not attached an interactive demo link.</p>
        )}
      </div>
    </section>
  );
}
