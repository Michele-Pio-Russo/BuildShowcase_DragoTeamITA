'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_LABELS } from '@/lib/types';

type Crumb = { label: string; href?: string };
type SupabaseClient = ReturnType<typeof createClient>;

async function fetchTitle(
  table: 'builds' | 'loadouts',
  id: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data } = await supabase.from(table).select('title').eq('id', id).maybeSingle();
  return data?.title ?? '…';
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // cache di sessione dei titoli già risolti, per non rifare la query ogni volta
  const titleCache = useRef<Map<string, string>>(new Map());
  const [, forceRender] = useState(0);

  function getTitle(table: 'builds' | 'loadouts', id: string): string {
    const key = `${table}:${id}`;
    const cached = titleCache.current.get(key);
    if (cached) return cached;
    fetchTitle(table, id, supabase).then((title) => {
      titleCache.current.set(key, title);
      forceRender((n) => n + 1);
    });
    return '…';
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0 || pathname === '/dashboard') return null;

  const crumbs: Crumb[] = [{ label: 'Home', href: '/dashboard' }];

  if (segments[0] === 'build') {
    if (segments.length === 1) {
      crumbs.push({ label: 'Build' });
    } else if (segments[1] === 'nuova') {
      crumbs.push({ label: 'Build', href: '/build' });
      crumbs.push({ label: 'Nuova build' });
    } else {
      const buildId = segments[1];
      const isEdit = segments[2] === 'edit';
      const fromLoadout = searchParams.get('fromLoadout');
      const fromCategory = searchParams.get('fromCategory');
      const buildTitle = getTitle('builds', buildId);

      if (fromLoadout) {
        const loadoutTitle = getTitle('loadouts', fromLoadout);
        crumbs.push({ label: 'Loadout', href: '/loadout' });
        crumbs.push({ label: loadoutTitle, href: `/loadout/${fromLoadout}` });
      } else if (fromCategory) {
        crumbs.push({
          label: CATEGORY_LABELS[fromCategory] ?? fromCategory,
          href: `/categoria/${fromCategory}`,
        });
      } else {
        crumbs.push({ label: 'Build', href: '/build' });
      }

      crumbs.push({ label: buildTitle, href: isEdit ? `/build/${buildId}` : undefined });
      if (isEdit) crumbs.push({ label: 'Modifica' });
    }
  } else if (segments[0] === 'categoria') {
    const slug = segments[1];
    crumbs.push({ label: 'Categorie' });
    crumbs.push({ label: CATEGORY_LABELS[slug] ?? slug });
  } else if (segments[0] === 'loadout') {
    if (segments.length === 1) {
      crumbs.push({ label: 'Loadout' });
    } else if (segments[1] === 'nuovo') {
      crumbs.push({ label: 'Loadout', href: '/loadout' });
      crumbs.push({ label: 'Nuovo loadout' });
    } else {
      const loadoutId = segments[1];
      const isEdit = segments[2] === 'edit';
      const loadoutTitle = getTitle('loadouts', loadoutId);
      crumbs.push({ label: 'Loadout', href: '/loadout' });
      crumbs.push({ label: loadoutTitle, href: isEdit ? `/loadout/${loadoutId}` : undefined });
      if (isEdit) crumbs.push({ label: 'Modifica' });
    }
  } else if (segments[0] === 'preferiti') {
    crumbs.push({ label: 'Preferiti' });
  } else if (segments[0] === 'admin') {
    crumbs.push({ label: 'Amministrazione' });
    if (segments[1] === 'utenti') crumbs.push({ label: 'Utenti' });
  } else {
    return null;
  }

  return (
    <nav className="px-4 md:px-8 pt-4 pb-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-700">/</span>}
          {c.href ? (
            <Link href={c.href} className="hover:text-slate-300">
              {c.label}
            </Link>
          ) : (
            <span className="text-slate-300">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
