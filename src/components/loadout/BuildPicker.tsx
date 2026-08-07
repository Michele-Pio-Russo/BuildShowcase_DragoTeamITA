'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Build } from '@/lib/types';

export default function BuildPicker({
  categorySlug,
  value,
  onChange,
  placeholder = 'Cerca una build esistente…',
}: {
  categorySlug: string;
  value: Build | null;
  onChange: (build: Build | null) => void;
  placeholder?: string;
}) {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Build[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      let q = supabase
        .from('builds')
        .select('*, category:categories(*)')
        .eq('status', 'pubblicata')
        .eq('category.slug', categorySlug)
        .limit(8);
      if (query.trim()) {
        q = q.or(`title.ilike.%${query}%,item_name.ilike.%${query}%`);
      }
      const { data } = await q;
      // filtro extra: il join su category.slug non è filtrabile direttamente in tutte le versioni,
      // quindi ricontrolliamo lato client per sicurezza
      setResults(((data as Build[]) ?? []).filter((b) => b.category?.slug === categorySlug));
    })();
  }, [query, open, categorySlug]);

  if (value) {
    return (
      <div className="flex items-center gap-2 card px-3 py-2">
        <span className="text-sm text-slate-100 truncate flex-1">
          {value.title} <span className="text-slate-500">· {value.item_name}</span>
        </span>
        <button
          onClick={() => onChange(null)}
          className="text-xs text-slate-500 hover:text-red-400 shrink-0"
        >
          Rimuovi collegamento
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="input-base"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full card overflow-hidden max-h-56 overflow-y-auto">
          {results.map((b) => (
            <button
              key={b.id}
              onMouseDown={() => {
                onChange(b);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-base-700/60 border-b border-base-700 last:border-0"
            >
              {b.title} <span className="text-slate-500">· {b.item_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
