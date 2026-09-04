'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Target = 'build' | 'loadout';

export default function FavoriteButton({
  targetType,
  targetId,
  initialFavorite,
  savesCount,
}: {
  targetType: Target;
  targetId: string;
  initialFavorite: boolean;
  savesCount: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [count, setCount] = useState(savesCount);
  const [loading, setLoading] = useState(false);

  const column = targetType === 'build' ? 'build_id' : 'loadout_id';

  async function toggle() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Il conteggio (saves_count su builds/loadouts) è gestito da un trigger sul
    // database quando questa riga viene inserita/eliminata — non lo aggiorniamo
    // più da qui, perché per un membro normale un update diretto sulla tabella
    // builds/loadouts verrebbe bloccato in silenzio dalla RLS.
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq(column, targetId);
      setCount((c) => Math.max(0, c - 1));
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, [column]: targetId });
      setCount((c) => c + 1);
      setIsFavorite(true);
    }

    // Invalida la cache di navigazione lato client, così se dopo vai sulla
    // pagina "Preferiti" vedi subito questa build/loadout, senza dover
    // ricaricare manualmente il sito.
    router.refresh();

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
