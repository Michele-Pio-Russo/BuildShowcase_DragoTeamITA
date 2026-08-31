'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Build, Category, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import BuildCard from './BuildCard';

type ViewMode = 'griglia' | 'lista' | 'tabella';
type SortMode = 'recenti' | 'popolari' | 'salvate' | 'alfabetico';

export default function BuildExplorer({ fixedCategorySlug }: { fixedCategorySlug?: string }) {
  const supabase = createClient();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(fixedCategorySlug ?? '');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [sort, setSort] = useState<SortMode>('recenti');
  const [view, setView] = useState<ViewMode>('griglia');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: tagList }] = await Promise.all([
        supabase.from('categories').select('*').order('ordine'),
        supabase.from('tags').select('*').order('nome'),
      ]);
      setCategories(cats ?? []);
      setTags(tagList ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from('builds')
        .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*), build_tags(tag:tags(*))')
        .eq('status', 'pubblicata');

      if (categoryFilter) {
        const cat = categories.find((c) => c.slug === categoryFilter);
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,item_name.ilike.%${search}%`);
      }

      switch (sort) {
        case 'recenti':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popolari':
          query = query.order('views_count', { ascending: false });
          break;
        case 'salvate':
          query = query.order('saves_count', { ascending: false });
          break;
        case 'alfabetico':
          query = query.order('title', { ascending: true });
          break;
      }

      const { data } = await query.limit(60);
      let result = ((data as any[]) ?? []).map((b) => ({
        ...b,
        tags: (b.build_tags ?? []).map((bt: any) => bt.tag).filter(Boolean),
      })) as Build[];

      if (authorFilter.trim()) {
        result = result.filter((b) =>
          b.author?.username.toLowerCase().includes(authorFilter.toLowerCase())
        );
      }

      if (user) {
        const { data: favs } = await supabase
          .from('favorites')
          .select('build_id')
          .eq('user_id', user.id);
        setFavoriteIds(new Set((favs ?? []).map((f) => f.build_id)));
      }

      setBuilds(result);
      setLoading(false);
    })();
  }, [search, categoryFilter, sort, categories]);

  const filteredByTag = useMemo(() => {
    if (!tagFilter) return builds;
    return builds.filter((b) => b.tags?.some((t) => t.nome === tagFilter));
  }, [builds, tagFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          className="input-base md:max-w-xs"
          placeholder="Cerca per titolo o oggetto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!fixedCategorySlug && (
          <select
            className="input-base md:max-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tutte le categorie</option>
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        )}
        <input
          className="input-base md:max-w-[180px]"
          placeholder="Filtra per autore…"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
        />
        <select
          className="input-base md:max-w-[160px]"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">Tutti i tag</option>
          {tags.map((t) => (
            <option key={t.id} value={t.nome}>
              {t.nome}
            </option>
          ))}
        </select>
        <select
          className="input-base md:max-w-[180px]"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
        >
          <option value="recenti">Più recenti</option>
          <option value="popolari">Più popolari</option>
          <option value="salvate">Più salvate</option>
          <option value="alfabetico">Alfabetico</option>
        </select>

        <div className="flex gap-1 md:ml-auto">
          {(['griglia', 'lista', 'tabella'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 rounded-lg text-xs border ${
                view === v
                  ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                  : 'border-base-600 text-slate-400 hover:text-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Caricamento…</p>
      ) : filteredByTag.length === 0 ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Nessuna build trovata con questi filtri.
        </p>
      ) : view === 'griglia' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredByTag.map((b) => (
            <BuildCard key={b.id} build={b} fromCategory={fixedCategorySlug} />
          ))}
        </div>
      ) : view === 'lista' ? (
        <div className="space-y-2">
          {filteredByTag.map((b) => (
            <Link
              key={b.id}
              href={`/build/${b.id}`}
              className="card flex items-center gap-4 px-4 py-3 hover:border-accent-500/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{b.title}</p>
                <p className="text-xs text-slate-400 truncate">
                  {CATEGORY_LABELS[b.category?.slug ?? ''] ?? ''} · {b.item_name}
                </p>
              </div>
              <span className="text-xs text-slate-500 shrink-0">{b.author?.username}</span>
              <span className="text-xs text-slate-500 shrink-0">★ {b.saves_count}</span>
              {favoriteIds.has(b.id) && <span className="text-gold-400 shrink-0">★</span>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-base-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Titolo</th>
                <th className="text-left px-4 py-2 font-medium">Categoria</th>
                <th className="text-left px-4 py-2 font-medium">Autore</th>
                <th className="text-left px-4 py-2 font-medium">Aggiornata</th>
                <th className="text-left px-4 py-2 font-medium">Salvate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700">
              {filteredByTag.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-base-700/40 cursor-pointer"
                  onClick={() => (window.location.href = `/build/${b.id}`)}
                >
                  <td className="px-4 py-2 text-slate-100">{b.title}</td>
                  <td className="px-4 py-2 text-slate-400">
                    {CATEGORY_LABELS[b.category?.slug ?? ''] ?? ''}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{b.author?.username}</td>
                  <td className="px-4 py-2 text-slate-400">
                    {new Date(b.updated_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{b.saves_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
