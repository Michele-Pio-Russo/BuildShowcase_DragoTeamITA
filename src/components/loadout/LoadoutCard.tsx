import Link from 'next/link';
import type { Loadout } from '@/lib/types';

export default function LoadoutCard({ loadout }: { loadout: Loadout }) {
  const warframeName = loadout.warframe_build?.title ?? loadout.warframe_item_name ?? '—';
  const companionName = loadout.companion_build?.title ?? loadout.companion_item_name ?? null;

  return (
    <Link
      href={`/loadout/${loadout.id}`}
      className="card overflow-hidden hover:border-accent-500/40 transition-colors group flex flex-col"
    >
      <div className="aspect-video bg-base-900 relative overflow-hidden">
        {loadout.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loadout.image_url}
            alt={loadout.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-slate-600">
            ⬡
          </div>
        )}
        {loadout.status === 'bozza' && (
          <span className="absolute top-2 right-2 badge bg-base-900/80">Bozza</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <span className="text-xs text-gold-400 mb-1">Loadout completo</span>
        <h3 className="text-sm font-medium text-slate-100 line-clamp-1">{loadout.title}</h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{warframeName}</p>
        {companionName && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Companion: {companionName}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-700 text-xs text-slate-500">
          <span className="truncate">{loadout.author?.username ?? '—'}</span>
        </div>
      </div>
    </Link>
  );
}
