'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_LABELS } from '@/lib/types';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Home',
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

// Segmenti che compaiono nell'URL ma non hanno una propria pagina raggiungibile
// (esistono solo le loro sottopagine) — restano nel breadcrumb come testo, non cliccabili.
const NON_NAVIGABLE_SEGMENTS = new Set(['categoria', 'admin']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Crumb = { path: string; label: string; clickable: boolean };
type SupabaseClient = ReturnType<typeof createClient>;

async function resolveLabel(path: string, supabase: SupabaseClient): Promise<string> {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  const parent = segments[segments.length - 2];

  if (SEGMENT_LABELS[last]) return SEGMENT_LABELS[last];
  if (CATEGORY_LABELS[last]) return CATEGORY_LABELS[last];

  if (UUID_RE.test(last)) {
    const table = parent === 'build' ? 'builds' : parent === 'loadout' ? 'loadouts' : null;
    if (table) {
      const { data } = await supabase.from(table).select('title').eq('id', last).maybeSingle();
      if (data?.title) return data.title;
    }
    return '…';
  }

  return last;
}

function isClickable(path: string): boolean {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  return !NON_NAVIGABLE_SEGMENTS.has(last);
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const supabase = createClient();
  const [stack, setStack] = useState<Crumb[]>([
    { path: '/dashboard', label: 'Home', clickable: true },
  ]);
  const resolving = useRef<Set<string>>(new Set());

  // Aggiorna lo STORICO delle pagine visitate (non la struttura dell'URL)
  useEffect(() => {
    if (pathname === '/dashboard') {
      setStack([{ path: '/dashboard', label: 'Home', clickable: true }]);
      return;
    }

    setStack((prev) => {
      const existingIndex = prev.findIndex((c) => c.path === pathname);
      if (existingIndex !== -1) {
        // Pagina già presente nello storico (es. cliccata dal breadcrumb, o tasto
        // Indietro del browser): troncamo lo storico da quel punto in poi.
        return prev.slice(0, existingIndex + 1);
      }
      // Pagina nuova: la aggiungiamo in coda (con etichetta provvisoria, risolta subito dopo).
      return [...prev, { path: pathname, label: '…', clickable: isClickable(pathname) }];
    });
  }, [pathname]);

  // Risolve l'etichetta reale (titolo build/loadout, o nome sezione) per la pagina corrente
  useEffect(() => {
    const current = pathname;
    if (resolving.current.has(current)) return;
    resolving.current.add(current);
    resolveLabel(current, supabase).then((label) => {
      setStack((prev) => prev.map((c) => (c.path === current ? { ...c, label } : c)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (stack.length <= 1) return null;

  return (
    <nav className="px-4 md:px-8 pt-4 pb-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
      {stack.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-700">/</span>}
          {i === stack.length - 1 || !c.clickable ? (
            <span className="text-slate-300">{c.label}</span>
          ) : (
            <Link href={c.path} className="hover:text-slate-300">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
