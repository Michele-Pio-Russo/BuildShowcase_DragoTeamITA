import Link from 'next/link';
import type { Build } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

export default function BuildCard({ build, fromCategory }: { build: Build; fromCategory?: string }) {
  const categorySlug = build.category?.slug ?? '';
  const categoryLabel = CATEGORY_LABELS[categorySlug] ?? build.category?.label ?? '';
  const href = fromCategory ? `/build/${build.id}?fromCategory=${fromCategory}` : `/build/${build.id}`;

  return (
    <Link
      href={href}
      className="card overflow-hidden hover:border-accent-500/40 transition-colors group flex flex-col"
    >
      <div className="aspect-video bg-base-900 relative overflow-hidden">
        {build.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={build.image_url}
            alt={build.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-slate-600">
            ◈
          </div>
        )}
        {build.status === 'bozza' && (
          <span className="absolute top-2 right-2 badge bg-base-900/80">Bozza</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <span className="text-xs text-gold-400 mb-1">{categoryLabel}</span>
        <h3 className="text-sm font-medium text-slate-100 line-clamp-1">{build.title}</h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{build.item_name}</p>
        {build.tags && build.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {build.tags.slice(0, 3).map((t) => (
              <span key={t.id} className="badge !py-0 !text-[10px]">
                {t.nome}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-700 text-xs text-slate-500">
          <span className="truncate">{build.author?.username ?? '—'}</span>
          <span className="flex items-center gap-1 shrink-0">★ {build.saves_count}</span>
        </div>
      </div>
    </Link>
  );
}
