import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Build, BuildMod, Profile, BuildHistoryEntry, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import FavoriteButton from '@/components/build/FavoriteButton';
import DuplicateButton from '@/components/build/DuplicateButton';
import DeleteBuildButton from '@/components/build/DeleteBuildButton';
import CommentSection from '@/components/comments/CommentSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { preserveLineBreaks } from '@/lib/markdown';

export default async function BuildDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: build } = await supabase
    .from('builds')
    .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*)')
    .eq('id', params.id)
    .single<Build>();

  if (!build) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single<Profile>();

  const canEdit = profile?.role === 'editor' || profile?.role === 'admin';
  const canDelete = profile?.role === 'admin' || (profile?.role === 'editor' && build.author_id === user?.id);

  const [{ data: mods }, { data: buildTags }, { data: history }, { data: favorite }] =
    await Promise.all([
      supabase.from('build_mods').select('*').eq('build_id', build.id).order('ordine'),
      supabase.from('build_tags').select('tag:tags(*)').eq('build_id', build.id),
      supabase
        .from('build_history')
        .select('*, editor:profiles!build_history_editor_id_fkey(*)')
        .eq('build_id', build.id)
        .order('changed_at', { ascending: false })
        .limit(10),
      user
        ? supabase
            .from('favorites')
            .select('build_id')
            .eq('user_id', user.id)
            .eq('build_id', build.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  // conteggio visualizzazioni (fire and forget)
  supabase.from('builds').update({ views_count: build.views_count + 1 }).eq('id', build.id).then();

  const tags = (buildTags?.map((t: any) => t.tag).filter(Boolean) ?? []) as Tag[];

  const statLabels: Record<string, string> = {
    critica: 'Critica',
    status: 'Status',
    danno: 'Danno',
    sopravvivenza: 'Sopravvivenza',
    energia: 'Energia',
    range: 'Range',
    durata: 'Durata',
    forza: 'Forza',
    efficienza: 'Efficienza',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-4">
        <Link href="/build" className="text-sm text-slate-400 hover:text-slate-200">
          ← Torna alle build
        </Link>
      </div>

      {build.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={build.image_url}
          alt={build.title}
          className="w-full max-h-96 object-contain rounded-xl border border-base-600 bg-base-900 mb-5"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-sm text-gold-400">
            {CATEGORY_LABELS[build.category?.slug ?? ''] ?? build.category?.label}
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mt-1">{build.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{build.item_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            buildId={build.id}
            initialFavorite={!!favorite}
            savesCount={build.saves_count}
          />
          {canEdit && (
            <>
              <Link href={`/build/${build.id}/edit`} className="btn-secondary">
                Modifica
              </Link>
              <DuplicateButton build={build} mods={(mods as BuildMod[]) ?? []} />
            </>
          )}
          {canDelete && <DeleteBuildButton buildId={build.id} buildTitle={build.title} />}
        </div>
      </div>

      {/* Proprietà */}
      <div className="card p-4 my-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <Prop label="Autore" value={build.author?.username ?? '—'} />
        <Prop label="Stato" value={build.status === 'pubblicata' ? 'Pubblicata' : 'Bozza'} />
        <Prop label="Creata" value={new Date(build.created_at).toLocaleDateString('it-IT')} />
        <Prop label="Aggiornata" value={new Date(build.updated_at).toLocaleDateString('it-IT')} />
        {build.forma && <Prop label="Forma" value={build.forma} />}
        {build.polarity && <Prop label="Polarità" value={build.polarity} />}
        {build.reattore && <Prop label="Reattore/Catalizzatore" value="Sì" />}
        {build.aura && <Prop label="Aura" value={build.aura} />}
        {build.exilus && <Prop label="Exilus" value={build.exilus} />}
        {build.arcane && <Prop label="Arcane" value={build.arcane} />}
        {build.focus_school && <Prop label="Focus School" value={build.focus_school} />}
        {build.archon_shards && <Prop label="Archon Shards" value={build.archon_shards} />}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map((t) => (
            <span key={t.id} className="badge badge-gold">
              {t.nome}
            </span>
          ))}
        </div>
      )}

      {build.description_md && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Descrizione</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preserveLineBreaks(build.description_md)}</ReactMarkdown>
          </div>
        </section>
      )}

      {build.playstyle_md && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Stile di gioco e casi d&apos;uso</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preserveLineBreaks(build.playstyle_md)}</ReactMarkdown>
          </div>
        </section>
      )}

      {build.mods_image_url ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Configurazione mod</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={build.mods_image_url}
            alt="Configurazione mod"
            className="w-full max-h-[32rem] object-contain rounded-xl border border-base-600 bg-base-900"
          />
        </section>
      ) : (
        mods && mods.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Mod</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 bg-base-700/40">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Mod</th>
                  <th className="text-left px-4 py-2 font-medium">Slot</th>
                  <th className="text-left px-4 py-2 font-medium">Rank</th>
                  <th className="text-left px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-700">
                {(mods as BuildMod[]).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-slate-100">{m.mod_name}</td>
                    <td className="px-4 py-2 text-slate-400">{m.slot ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-400">{m.rank ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-400">{m.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )
      )}

      {build.stats && Object.keys(build.stats).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Statistiche e priorità</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(build.stats).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="card px-3 py-2">
                    <p className="text-xs text-slate-500">{statLabels[key] ?? key}</p>
                    <p className="text-sm text-slate-100">{value}</p>
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {history && history.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Storico modifiche</h2>
          <div className="card divide-y divide-base-700">
            {(history as BuildHistoryEntry[]).map((h) => (
              <div key={h.id} className="px-4 py-2 text-sm flex justify-between">
                <span className="text-slate-300">{h.editor?.username}</span>
                <span className="text-slate-500">
                  {new Date(h.changed_at).toLocaleString('it-IT')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <CommentSection buildId={build.id} />
    </div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
