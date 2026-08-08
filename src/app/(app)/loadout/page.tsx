import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LoadoutCard from '@/components/loadout/LoadoutCard';
import type { Loadout } from '@/lib/types';

export default async function LoadoutListPage() {
  const supabase = createClient();

  const { data: loadouts } = await supabase
    .from('loadouts')
    .select(
      '*, author:profiles!loadouts_author_id_fkey(*), warframe_build:builds!loadouts_warframe_build_id_fkey(*), companion_build:builds!loadouts_companion_build_id_fkey(*)'
    )
    .eq('status', 'pubblicata')
    .order('updated_at', { ascending: false })
    .limit(60);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-slate-100">Loadout completi</h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">
        Warframe, armi e companion consigliati insieme, pronti all&apos;uso.
      </p>

      {!loadouts?.length ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Nessun loadout pubblicato ancora.{' '}
          <Link href="/loadout/nuovo" className="text-accent-400 hover:text-accent-300">
            Creane uno
          </Link>
          .
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(loadouts as Loadout[]).map((l) => (
            <LoadoutCard key={l.id} loadout={l} />
          ))}
        </div>
      )}
    </div>
  );
}
