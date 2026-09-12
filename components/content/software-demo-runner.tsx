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
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-4 backdrop-blur-sm" aria-label="Public demo">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Interactive Demo & Preview</h2>
        </div>
        <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
          Public Access
        </span>
      </div>

      <p className="text-sm text-slate-400">
        Test and explore {title} before purchasing its private source code archive.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {live && (
          <a
            href={live}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 active:bg-blue-700 transition-colors"
          >
            <span>Open live demo</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {video && (
          <a
            href={video}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700/80 hover:text-white transition-colors"
          >
            <PlayCircle className="h-4 w-4 text-blue-400" />
            <span>Watch Video Demo</span>
          </a>
        )}

        {!live && !video && (
          <p className="text-sm text-slate-500 italic">The creator has not attached an interactive demo link.</p>
        )}
      </div>
    </section>
  );
}
