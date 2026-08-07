'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

const categories = Object.entries(CATEGORY_LABELS);

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const canEdit = profile.role === 'editor' || profile.role === 'admin';
  const isAdmin = profile.role === 'admin';

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const linkClass = (href: string) =>
    clsx(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
      pathname === href
        ? 'bg-accent-500/15 text-accent-300 border border-accent-500/30'
        : 'text-slate-400 hover:text-slate-100 hover:bg-base-800'
    );

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-base-900 border-r border-base-700 h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-base-700">
        <div className="flex items-center gap-2">
          <span className="text-gold-400 text-lg">◈</span>
          <span className="font-semibold text-slate-100 truncate">Archivio del Clan</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <Link href="/dashboard" className={linkClass('/dashboard')}>
          <span>▣</span> Dashboard
        </Link>
        <Link href="/build" className={linkClass('/build')}>
          <span>▤</span> Tutte le build
        </Link>
        <Link href="/loadout" className={linkClass('/loadout')}>
          <span>⬡</span> Loadout completi
        </Link>

        <div className="pt-4 pb-1 px-3 text-xs uppercase tracking-wide text-slate-500">
          Categorie
        </div>
        {categories.map(([slug, label]) => (
          <Link key={slug} href={`/categoria/${slug}`} className={linkClass(`/categoria/${slug}`)}>
            <span>–</span> {label}
          </Link>
        ))}

        <div className="pt-4">
          <Link href="/preferiti" className={linkClass('/preferiti')}>
            <span>★</span> Preferiti
          </Link>
        </div>

        {isAdmin && (
          <div className="pt-4">
            <div className="pb-1 px-3 text-xs uppercase tracking-wide text-slate-500">
              Amministrazione
            </div>
            <Link href="/admin/utenti" className={linkClass('/admin/utenti')}>
              <span>⚙</span> Utenti
            </Link>
          </div>
        )}
      </nav>

      {canEdit && (
        <div className="px-3 pb-3 space-y-1.5">
          <Link href="/build/nuova" className="btn-gold w-full flex items-center justify-center gap-1.5">
            <span>+</span> Nuova build
          </Link>
          <Link
            href="/loadout/nuovo"
            className="btn-secondary w-full flex items-center justify-center gap-1.5 !text-xs"
          >
            <span>+</span> Nuovo loadout
          </Link>
        </div>
      )}

      <div className="px-3 py-3 border-t border-base-700 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-200 truncate">{profile.username}</p>
          <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
