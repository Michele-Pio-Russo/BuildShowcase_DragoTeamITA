'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function FavoriteButton({
  buildId,
  initialFavorite,
  savesCount,
}: {
  buildId: string;
  initialFavorite: boolean;
  savesCount: number;
}) {
  const supabase = createClient();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [count, setCount] = useState(savesCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('build_id', buildId);
      await supabase
        .from('builds')
        .update({ saves_count: Math.max(0, count - 1) })
        .eq('id', buildId);
      setCount((c) => Math.max(0, c - 1));
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, build_id: buildId });
      await supabase.from('builds').update({ saves_count: count + 1 }).eq('id', buildId);
      setCount((c) => c + 1);
      setIsFavorite(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
        isFavorite
          ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
          : 'border-base-600 text-slate-300 hover:text-gold-400 hover:border-gold-500/40'
      }`}
    >
      <span>{isFavorite ? '★' : '☆'}</span>
      {isFavorite ? 'Salvata' : 'Salva'} · {count}
    </button>
  );
}
