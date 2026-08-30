'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_LABELS } from '@/lib/types';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  build: 'Build',
  loadout: 'Loadout',
  categoria: 'Categorie',
  preferiti: 'Preferiti',
  admin: 'Amministrazione',
  utenti: 'Utenti',
  nuova: 'Nuova build',
  nuovo: 'Nuovo loadout',
  edit: 'Modifica',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Segmenti che compaiono nell'URL ma non hanno una propria pagina raggiungibile
// (esistono solo le loro sottopagine) — nel breadcrumb restano come testo semplice,
// non cliccabile, per evitare un 404.
const NON_NAVIGABLE_SEGMENTS = new Set(['categoria', 'admin']);

export default function Breadcrumbs() {
  const pathname = usePathname();
  const supabase = createClient();
  const [titles, setTitles] = useState<Record<string, string>>({});

  const segments = pathname.split('/').filter(Boolean);

  useEffect(() => {
    async function loadTitles() {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (UUID_RE.test(seg) && !titles[seg]) {
          const parent = segments[i - 1];
          const table = parent === 'build' ? 'builds' : parent === 'loadout' ? 'loadouts' : null;
          if (table) {
            const { data } = await supabase.from(table).select('title').eq('id', seg).maybeSingle();
            if (data?.title) {
              setTitles((prev) => ({ ...prev, [seg]: data.title }));
            }
          }
        }
      }
    }
    loadTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (segments.length === 0 || pathname === '/dashboard') return null;

  const crumbs: { label: string; href: string; clickable: boolean }[] = [
    { label: 'Home', href: '/dashboard', clickable: true },
  ];
  let hrefAcc = '';
  segments.forEach((seg) => {
    hrefAcc += `/${seg}`;
    let label = SEGMENT_LABELS[seg];
    if (!label) {
      if (UUID_RE.test(seg)) {
        label = titles[seg] ?? '…';
      } else if (CATEGORY_LABELS[seg]) {
        label = CATEGORY_LABELS[seg];
      } else {
        label = seg;
      }
    }
    crumbs.push({ label, href: hrefAcc, clickable: !NON_NAVIGABLE_SEGMENTS.has(seg) });
  });

  return (
    <nav className="px-4 md:px-8 pt-4 pb-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-700">/</span>}
          {i === crumbs.length - 1 || !c.clickable ? (
            <span className="text-slate-300">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-slate-300">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
