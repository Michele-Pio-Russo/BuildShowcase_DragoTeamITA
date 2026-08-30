import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Loadout, LoadoutWeapon, Profile, WeaponSlot } from '@/lib/types';
import { preserveLineBreaks } from '@/lib/markdown';
import MarkdownText from '@/components/ui/MarkdownText';
import FavoriteButton from '@/components/build/FavoriteButton';
import CommentSection from '@/components/comments/CommentSection';
import DeleteLoadoutButton from '@/components/loadout/DeleteLoadoutButton';

const slotLabels: Record<WeaponSlot, string> = {
  primaria: 'Arma primaria',
  secondaria: 'Arma secondaria',
  melee: 'Arma melee',
  exalted: 'Arma Exalted',
};

export default async function LoadoutDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: loadout } = await supabase
    .from('loadouts')
    .select(
      `*, author:profiles!loadouts_author_id_fkey(*),
       warframe_build:builds!loadouts_warframe_build_id_fkey(*, category:categories(*)),
       companion_build:builds!loadouts_companion_build_id_fkey(*, category:categories(*)),
       companion_weapon_build:builds!loadouts_companion_weapon_build_id_fkey(*, category:categories(*))`
    )
    .eq('id', params.id)
    .single<Loadout>();

  if (!loadout) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single<Profile>();

  const canEdit = profile?.role === 'editor' || profile?.role === 'admin';
  const canDelete =
    profile?.role === 'admin' || (profile?.role === 'editor' && loadout.author_id === user?.id);

  const { data: favorite } = user
    ? await supabase
        .from('favorites')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('loadout_id', loadout.id)
        .maybeSingle()
    : { data: null };

  const { data: weaponsData } = await supabase
    .from('loadout_weapons')
    .select('*, build:builds(*, category:categories(*))')
    .eq('loadout_id', loadout.id)
    .order('ordine');

  const weapons = (weaponsData as LoadoutWeapon[]) ?? [];
  const bySlot = (slot: WeaponSlot) => weapons.filter((w) => w.slot === slot);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-4">
        <Link href="/loadout" className="text-sm text-slate-400 hover:text-slate-200">
          ← Torna ai loadout
        </Link>
      </div>

      {loadout.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={loadout.image_url}
          alt={loadout.title}
          className="w-full max-h-96 object-contain rounded-xl border border-base-600 bg-base-900 mb-5"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <span className="text-sm text-gold-400">Loadout completo</span>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mt-1">{loadout.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{loadout.author?.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            targetType="loadout"
            targetId={loadout.id}
            initialFavorite={!!favorite}
            savesCount={loadout.saves_count}
          />
          {canEdit && (
            <Link href={`/loadout/${loadout.id}/edit`} className="btn-secondary">
              Modifica
            </Link>
          )}
          {canDelete && <DeleteLoadoutButton loadoutId={loadout.id} loadoutTitle={loadout.title} />}
        </div>
      </div>

      {/* Warframe */}
      <section className="mb-6">
        <h2 className="text-lg font-medium text-slate-100 mb-2">Warframe</h2>
        {loadout.warframe_build ? (
          <Link
            href={`/build/${loadout.warframe_build.id}`}
            className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
          >
            <div>
              <p className="text-sm text-slate-100">{loadout.warframe_build.title}</p>
              <p className="text-xs text-slate-500">{loadout.warframe_build.item_name}</p>
            </div>
            <span className="text-xs text-accent-400">Vedi build →</span>
          </Link>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-slate-100">{loadout.warframe_item_name ?? '—'}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
          {loadout.warframe_forma && <Prop label="Forma" value={loadout.warframe_forma} />}
          {loadout.warframe_polarity && <Prop label="Polarità" value={loadout.warframe_polarity} />}
          {loadout.warframe_aura && <Prop label="Aura" value={loadout.warframe_aura} />}
          {loadout.warframe_exilus && <Prop label="Exilus" value={loadout.warframe_exilus} />}
          {loadout.warframe_arcane && <Prop label="Arcane" value={loadout.warframe_arcane} />}
          {loadout.warframe_focus_school && (
            <Prop label="Focus School" value={loadout.warframe_focus_school} />
          )}
          {loadout.warframe_archon_shards && (
            <Prop label="Archon Shards" value={loadout.warframe_archon_shards} />
          )}
        </div>
      </section>

      {/* Armi */}
      {(['primaria', 'secondaria', 'melee', 'exalted'] as WeaponSlot[]).map(
        (slot) =>
          bySlot(slot).length > 0 && (
            <section key={slot} className="mb-6">
              <h2 className="text-lg font-medium text-slate-100 mb-2">{slotLabels[slot]}</h2>
              <div className="space-y-2">
                {bySlot(slot).map((w) =>
                  w.build ? (
                    <Link
                      key={w.id}
                      href={`/build/${w.build.id}`}
                      className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
                    >
                      <div>
                        <p className="text-sm text-slate-100">{w.build.title}</p>
                        <p className="text-xs text-slate-500">{w.build.item_name}</p>
                      </div>
                      <span className="text-xs text-accent-400">Vedi build →</span>
                    </Link>
                  ) : (
                    <div key={w.id} className="card p-4">
                      <p className="text-sm text-slate-100">{w.item_name}</p>
                    </div>
                  )
                )}
              </div>
            </section>
          )
      )}

      {/* Companion */}
      {(loadout.companion_build || loadout.companion_item_name) && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Companion</h2>
          {loadout.companion_build ? (
            <Link
              href={`/build/${loadout.companion_build.id}`}
              className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
            >
              <div>
                <p className="text-sm text-slate-100">{loadout.companion_build.title}</p>
                <p className="text-xs text-slate-500">{loadout.companion_build.item_name}</p>
              </div>
              <span className="text-xs text-accent-400">Vedi build →</span>
            </Link>
          ) : (
            <div className="card p-4">
              <p className="text-sm text-slate-100">{loadout.companion_item_name}</p>
            </div>
          )}

          {(loadout.companion_weapon_build || loadout.companion_weapon_item_name) && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Arma del companion</p>
              {loadout.companion_weapon_build ? (
                <Link
                  href={`/build/${loadout.companion_weapon_build.id}`}
                  className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
                >
                  <div>
                    <p className="text-sm text-slate-100">{loadout.companion_weapon_build.title}</p>
                    <p className="text-xs text-slate-500">{loadout.companion_weapon_build.item_name}</p>
                  </div>
                  <span className="text-xs text-accent-400">Vedi build →</span>
                </Link>
              ) : (
                <div className="card p-4">
                  <p className="text-sm text-slate-100">{loadout.companion_weapon_item_name}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {loadout.notes_md && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Note e strategia</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <MarkdownText text={loadout.notes_md} />
          </div>
        </section>
      )}

      <CommentSection loadoutId={loadout.id} />
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
