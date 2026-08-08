import { createClient } from '@/lib/supabase/server';
import BuildCard from '@/components/build/BuildCard';
import type { Build } from '@/lib/types';

export default async function PreferitiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: favs } = await supabase
    .from('favorites')
    .select('build:builds(*, category:categories(*), author:profiles!builds_author_id_fkey(*))')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const builds = (favs?.map((f: any) => f.build).filter(Boolean) ?? []) as Build[];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Preferiti</h1>
      <p className="text-slate-400 text-sm mb-6">Le build che hai salvato.</p>

      {builds.length === 0 ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Non hai ancora salvato nessuna build.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {builds.map((b) => (
            <BuildCard key={b.id} build={b} />
          ))}
        </div>
      )}
    </div>
  );
}
