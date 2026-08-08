'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteBuildButton({ buildId, buildTitle }: { buildId: string; buildTitle: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase.from('builds').delete().eq('id', buildId);

    if (deleteError) {
      setError(`Errore durante l'eliminazione: ${deleteError.message}`);
      setLoading(false);
      return;
    }

    router.push('/build');
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">Eliminare &quot;{buildTitle}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="btn-secondary !bg-red-900/60 !border-red-700 hover:!bg-red-800/60"
        >
          {loading ? 'Eliminazione…' : 'Conferma'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="btn-secondary"
        >
          Annulla
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="btn-secondary !text-red-400 hover:!bg-red-900/30"
    >
      Elimina
    </button>
  );
}
