import { createClient } from '@/lib/supabase/server';
import BuildCard from '@/components/build/BuildCard';
import LoadoutCard from '@/components/loadout/LoadoutCard';
import type { Build, Loadout } from '@/lib/types';

export default async function PreferitiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: buildFavs }, { data: loadoutFavs }] = await Promise.all([
    supabase
      .from('favorites')
      .select('build:builds(*, category:categories(*), author:profiles!builds_author_id_fkey(*))')
      .eq('user_id', user?.id ?? '')
      .not('build_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('favorites')
      .select(
        `loadout:loadouts(*, author:profiles!loadouts_author_id_fkey(*),
         warframe_build:builds!loadouts_warframe_build_id_fkey(*, category:categories(*)),
         companion_build:builds!loadouts_companion_build_id_fkey(*, category:categories(*)))`
      )
      .eq('user_id', user?.id ?? '')
      .not('loadout_id', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  const builds = (buildFavs?.map((f: any) => f.build).filter(Boolean) ?? []) as Build[];
  const loadouts = (loadoutFavs?.map((f: any) => f.loadout).filter(Boolean) ?? []) as Loadout[];
  const isEmpty = builds.length === 0 && loadouts.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Preferiti</h1>
      <p className="text-slate-400 text-sm mb-6">Le build e i loadout che hai salvato.</p>

      {isEmpty ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Non hai ancora salvato nessuna build o loadout.
        </p>
      ) : (
        <>
          {builds.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-medium text-slate-100 mb-3">Build</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {builds.map((b) => (
                  <BuildCard key={b.id} build={b} />
                ))}
              </div>
            </section>
          )}

          {loadouts.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-slate-100 mb-3">Loadout completi</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loadouts.map((l) => (
                  <LoadoutCard key={l.id} loadout={l} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
