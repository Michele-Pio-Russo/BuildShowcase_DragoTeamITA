import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BuildCard from '@/components/build/BuildCard';
import type { Build } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ count: totalBuilds }, { data: recentBuilds }, { data: popularBuilds }, { data: recentComments }] =
    await Promise.all([
      supabase.from('builds').select('*', { count: 'exact', head: true }).eq('status', 'pubblicata'),
      supabase
        .from('builds')
        .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*)')
        .eq('status', 'pubblicata')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('builds')
        .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*)')
        .eq('status', 'pubblicata')
        .order('saves_count', { ascending: false })
        .limit(4),
      supabase
        .from('comments')
        .select('*, author:profiles!comments_author_id_fkey(*), build:builds(id, title)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">Panoramica dell&apos;archivio build del clan</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Build pubblicate" value={totalBuilds ?? 0} />
        <StatCard label="Recenti (7gg)" value={recentBuilds?.length ?? 0} />
        <QuickLink href="/build" label="Cerca build" icon="⌕" />
        <QuickLink href="/preferiti" label="Preferiti" icon="★" />
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-100">Build recenti</h2>
          <Link href="/build?ordine=recenti" className="text-sm text-accent-400 hover:text-accent-300">
            Vedi tutte
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(recentBuilds as Build[] | null)?.map((b) => <BuildCard key={b.id} build={b} />)}
          {!recentBuilds?.length && <EmptyHint />}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-100">Build più popolari</h2>
          <Link href="/build?ordine=popolari" className="text-sm text-accent-400 hover:text-accent-300">
            Vedi tutte
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(popularBuilds as Build[] | null)?.map((b) => <BuildCard key={b.id} build={b} />)}
          {!popularBuilds?.length && <EmptyHint />}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-100 mb-3">Attività recente</h2>
        <div className="card divide-y divide-base-700">
          {recentComments?.length ? (
            recentComments.map((c: any) => (
              <div key={c.id} className="px-4 py-3 text-sm">
                <span className="text-slate-200 font-medium">{c.author?.username}</span>{' '}
                <span className="text-slate-400">ha commentato</span>{' '}
                <Link href={`/build/${c.build?.id}`} className="text-accent-400 hover:text-accent-300">
                  {c.build?.title}
                </Link>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">
              Nessuna attività recente.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-4">
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="card px-4 py-4 flex flex-col justify-center hover:border-accent-500/40 transition-colors">
      <span className="text-lg text-gold-400">{icon}</span>
      <p className="text-xs text-slate-300 mt-1">{label}</p>
    </Link>
  );
}

function EmptyHint() {
  return (
    <div className="col-span-full text-sm text-slate-500 text-center py-8 border border-dashed border-base-600 rounded-xl">
      Nessuna build ancora pubblicata.
    </div>
  );
}
