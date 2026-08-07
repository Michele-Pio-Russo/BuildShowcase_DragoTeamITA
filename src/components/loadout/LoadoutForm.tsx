'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, Loadout, LoadoutWeapon, WeaponSlot } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BuildPicker from './BuildPicker';

type Step = 1 | 2 | 3 | 4 | 5;
type LinkMode = 'build' | 'testo';

interface WeaponRow {
  id: string;
  slot: WeaponSlot;
  mode: LinkMode;
  build: Build | null;
  itemName: string;
}

const slotLabels: Record<WeaponSlot, string> = {
  primaria: 'Arma primaria',
  secondaria: 'Arma secondaria',
  melee: 'Arma melee',
};

const slotCategorySlug: Record<WeaponSlot, string> = {
  primaria: 'arma_primaria',
  secondaria: 'arma_secondaria',
  melee: 'arma_melee',
};

const emptyWeapon = (slot: WeaponSlot): WeaponRow => ({
  id: crypto.randomUUID(),
  slot,
  mode: 'build',
  build: null,
  itemName: '',
});

export default function LoadoutForm({ existingLoadout }: { existingLoadout?: Loadout }) {
  const supabase = createClient();
  const router = useRouter();
  const isEditing = !!existingLoadout;

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState(existingLoadout?.title ?? '');
  const [imageUrl, setImageUrl] = useState(existingLoadout?.image_url ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Step 2 — Warframe
  const [warframeMode, setWarframeMode] = useState<LinkMode>(
    existingLoadout?.warframe_build_id ? 'build' : 'testo'
  );
  const [warframeBuild, setWarframeBuild] = useState<Build | null>(
    existingLoadout?.warframe_build ?? null
  );
  const [warframeItemName, setWarframeItemName] = useState(existingLoadout?.warframe_item_name ?? '');
  const [warframeForma, setWarframeForma] = useState(existingLoadout?.warframe_forma ?? '');
  const [warframePolarity, setWarframePolarity] = useState(existingLoadout?.warframe_polarity ?? '');
  const [warframeAura, setWarframeAura] = useState(existingLoadout?.warframe_aura ?? '');
  const [warframeExilus, setWarframeExilus] = useState(existingLoadout?.warframe_exilus ?? '');
  const [warframeArcane, setWarframeArcane] = useState(existingLoadout?.warframe_arcane ?? '');
  const [warframeArchonShards, setWarframeArchonShards] = useState(
    existingLoadout?.warframe_archon_shards ?? ''
  );
  const [warframeFocusSchool, setWarframeFocusSchool] = useState(
    existingLoadout?.warframe_focus_school ?? ''
  );

  // Step 3 — Armi
  const [weapons, setWeapons] = useState<WeaponRow[]>([emptyWeapon('primaria')]);

  // Step 4 — Companion
  const [companionMode, setCompanionMode] = useState<LinkMode>(
    existingLoadout?.companion_build_id ? 'build' : 'testo'
  );
  const [companionBuild, setCompanionBuild] = useState<Build | null>(
    existingLoadout?.companion_build ?? null
  );
  const [companionItemName, setCompanionItemName] = useState(existingLoadout?.companion_item_name ?? '');
  const [companionWeaponMode, setCompanionWeaponMode] = useState<LinkMode>(
    existingLoadout?.companion_weapon_build_id ? 'build' : 'testo'
  );
  const [companionWeaponBuild, setCompanionWeaponBuild] = useState<Build | null>(
    existingLoadout?.companion_weapon_build ?? null
  );
  const [companionWeaponItemName, setCompanionWeaponItemName] = useState(
    existingLoadout?.companion_weapon_item_name ?? ''
  );

  // Step 5
  const [notes, setNotes] = useState(existingLoadout?.notes_md ?? '');

  useEffect(() => {
    if (!existingLoadout) return;
    (async () => {
      const { data: existingWeapons } = await supabase
        .from('loadout_weapons')
        .select('*, build:builds(*)')
        .eq('loadout_id', existingLoadout.id)
        .order('ordine');
      if (existingWeapons?.length) {
        setWeapons(
          (existingWeapons as LoadoutWeapon[]).map((w) => ({
            id: w.id,
            slot: w.slot,
            mode: w.build_id ? 'build' : 'testo',
            build: w.build ?? null,
            itemName: w.item_name ?? '',
          }))
        );
      }
    })();
  }, [existingLoadout]);

  function addWeapon(slot: WeaponSlot) {
    setWeapons((prev) => [...prev, emptyWeapon(slot)]);
  }

  function removeWeapon(id: string) {
    setWeapons((prev) => prev.filter((w) => w.id !== id));
  }

  function updateWeaponSlot(id: string, slot: WeaponSlot) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, slot, build: null, itemName: '' } : w)));
  }

  function updateWeaponMode(id: string, mode: LinkMode) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, mode } : w)));
  }

  function updateWeaponBuild(id: string, build: Build | null) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, build } : w)));
  }

  function updateWeaponName(id: string, itemName: string) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, itemName } : w)));
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return imageUrl || null;
    const ext = imageFile.name.split('.').pop();
    const path = `loadout-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('build-images').upload(path, imageFile);
    if (uploadError) {
      setError('Errore nel caricamento immagine: ' + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from('build-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function persist(status: 'bozza' | 'pubblicata') {
    setError(null);
    if (!title.trim()) {
      setError('Il titolo del loadout è obbligatorio.');
      setStep(1);
      return;
    }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Sessione scaduta, effettua di nuovo il login.');
      setSaving(false);
      return;
    }

    const finalImageUrl = await uploadImageIfNeeded();

    const payload = {
      title: title.trim(),
      status,
      image_url: finalImageUrl,
      notes_md: notes,
      warframe_build_id: warframeMode === 'build' ? warframeBuild?.id ?? null : null,
      warframe_item_name: warframeMode === 'testo' ? warframeItemName || null : null,
      warframe_forma: warframeForma || null,
      warframe_polarity: warframePolarity || null,
      warframe_aura: warframeAura || null,
      warframe_exilus: warframeExilus || null,
      warframe_arcane: warframeArcane || null,
      warframe_archon_shards: warframeArchonShards || null,
      warframe_focus_school: warframeFocusSchool || null,
      companion_build_id: companionMode === 'build' ? companionBuild?.id ?? null : null,
      companion_item_name: companionMode === 'testo' ? companionItemName || null : null,
      companion_weapon_build_id:
        companionWeaponMode === 'build' ? companionWeaponBuild?.id ?? null : null,
      companion_weapon_item_name:
        companionWeaponMode === 'testo' ? companionWeaponItemName || null : null,
    };

    let loadoutId = existingLoadout?.id;

    if (isEditing && loadoutId) {
      const { error: updateError } = await supabase.from('loadouts').update(payload).eq('id', loadoutId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
      await supabase.from('loadout_weapons').delete().eq('loadout_id', loadoutId);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('loadouts')
        .insert({ ...payload, author_id: user.id })
        .select()
        .single();
      if (insertError || !inserted) {
        setError(insertError?.message ?? 'Errore durante la creazione.');
        setSaving(false);
        return;
      }
      loadoutId = inserted.id;
    }

    const weaponsToInsert = weapons
      .filter((w) => (w.mode === 'build' ? w.build : w.itemName.trim()))
      .map((w, i) => ({
        loadout_id: loadoutId,
        slot: w.slot,
        build_id: w.mode === 'build' ? w.build?.id ?? null : null,
        item_name: w.mode === 'testo' ? w.itemName.trim() : null,
        ordine: i,
      }));
    if (weaponsToInsert.length) {
      await supabase.from('loadout_weapons').insert(weaponsToInsert);
    }

    setSaving(false);
    router.push(`/loadout/${loadoutId}`);
    router.refresh();
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Info base' },
    { n: 2, label: 'Warframe' },
    { n: 3, label: 'Armi' },
    { n: 4, label: 'Companion' },
    { n: 5, label: 'Note & Anteprima' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">
        {isEditing ? 'Modifica loadout' : 'Nuovo loadout completo'}
      </h1>
      <p className="text-slate-400 text-sm mb-1">
        Warframe + armi + companion consigliati, in un&apos;unica scheda.
      </p>

      <div className="flex items-center gap-2 my-5 overflow-x-auto">
        {steps.map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-colors ${
              step === s.n
                ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                : 'border-base-600 text-slate-400'
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Titolo del loadout *</label>
            <input
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Saryn Spore Spam — Loadout completo Steel Path"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Immagine (URL)</label>
            <input
              className="input-base"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-slate-500 mt-1">oppure carica un file:</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-400 mt-1"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-5 space-y-5">
          <ModeToggle mode={warframeMode} onChange={setWarframeMode} />

          {warframeMode === 'build' ? (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Build Warframe esistente</label>
              <BuildPicker
                categorySlug="warframe"
                value={warframeBuild}
                onChange={setWarframeBuild}
                placeholder="Cerca una build Warframe pubblicata…"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Nome del Warframe</label>
                <input
                  className="input-base"
                  value={warframeItemName}
                  onChange={(e) => setWarframeItemName(e.target.value)}
                  placeholder="es. Saryn Prime"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Forma</label>
                  <input
                    className="input-base"
                    value={warframeForma}
                    onChange={(e) => setWarframeForma(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Polarità</label>
                  <input
                    className="input-base"
                    value={warframePolarity}
                    onChange={(e) => setWarframePolarity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Aura</label>
                  <input
                    className="input-base"
                    value={warframeAura}
                    onChange={(e) => setWarframeAura(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Exilus</label>
                  <input
                    className="input-base"
                    value={warframeExilus}
                    onChange={(e) => setWarframeExilus(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Arcane</label>
                  <input
                    className="input-base"
                    value={warframeArcane}
                    onChange={(e) => setWarframeArcane(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Focus School e Archon Shards si applicano al loadout indipendentemente dal collegamento */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-base-700">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Focus School consigliata</label>
              <input
                className="input-base"
                value={warframeFocusSchool}
                onChange={(e) => setWarframeFocusSchool(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Archon Shards consigliate</label>
              <input
                className="input-base"
                value={warframeArchonShards}
                onChange={(e) => setWarframeArchonShards(e.target.value)}
                placeholder="es. 5x Tauforged Amber (Health)"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-5 space-y-5">
          <p className="text-xs text-slate-500">
            Aggiungi una o più armi consigliate per ogni slot. Ogni riga può collegarsi a una build
            già presente nell&apos;archivio oppure indicare solo il nome dell&apos;arma.
          </p>

          {(['primaria', 'secondaria', 'melee'] as WeaponSlot[]).map((slot) => (
            <div key={slot}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">{slotLabels[slot]}</label>
                <button
                  onClick={() => addWeapon(slot)}
                  className="text-xs text-accent-400 hover:text-accent-300"
                >
                  + Aggiungi
                </button>
              </div>
              <div className="space-y-2">
                {weapons
                  .filter((w) => w.slot === slot)
                  .map((w) => (
                    <div key={w.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <ModeToggle
                          mode={w.mode}
                          onChange={(m) => updateWeaponMode(w.id, m)}
                          compact
                        />
                        <div className="mt-1">
                          {w.mode === 'build' ? (
                            <BuildPicker
                              categorySlug={slotCategorySlug[slot]}
                              value={w.build}
                              onChange={(b) => updateWeaponBuild(w.id, b)}
                            />
                          ) : (
                            <input
                              className="input-base"
                              placeholder="Nome arma"
                              value={w.itemName}
                              onChange={(e) => updateWeaponName(w.id, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeWeapon(w.id)}
                        className="text-slate-500 hover:text-red-400 text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                {weapons.filter((w) => w.slot === slot).length === 0 && (
                  <p className="text-xs text-slate-600">Nessuna arma aggiunta per questo slot.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="card p-5 space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Companion</label>
            <ModeToggle mode={companionMode} onChange={setCompanionMode} />
            <div className="mt-2">
              {companionMode === 'build' ? (
                <BuildPicker
                  categorySlug="companion"
                  value={companionBuild}
                  onChange={setCompanionBuild}
                  placeholder="Cerca una build companion pubblicata…"
                />
              ) : (
                <input
                  className="input-base"
                  placeholder="Nome companion"
                  value={companionItemName}
                  onChange={(e) => setCompanionItemName(e.target.value)}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Arma del companion</label>
            <ModeToggle mode={companionWeaponMode} onChange={setCompanionWeaponMode} />
            <div className="mt-2">
              {companionWeaponMode === 'build' ? (
                <BuildPicker
                  categorySlug="arma_companion"
                  value={companionWeaponBuild}
                  onChange={setCompanionWeaponBuild}
                  placeholder="Cerca una build arma companion pubblicata…"
                />
              ) : (
                <input
                  className="input-base"
                  placeholder="Nome arma companion"
                  value={companionWeaponItemName}
                  onChange={(e) => setCompanionWeaponItemName(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Note generali (Markdown)</label>
            <textarea
              className="input-base min-h-[120px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Strategia generale, ordine delle abilità, consigli d'uso…"
            />
          </div>

          <div className="pt-3 border-t border-base-700">
            <p className="text-xs text-slate-500 mb-3">Anteprima riassuntiva</p>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">{title || 'Titolo loadout'}</h2>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>
                <span className="text-slate-500">Warframe:</span>{' '}
                {warframeMode === 'build'
                  ? warframeBuild?.title ?? 'non selezionato'
                  : warframeItemName || 'non specificato'}
              </li>
              <li>
                <span className="text-slate-500">Armi:</span>{' '}
                {weapons.filter((w) => (w.mode === 'build' ? w.build : w.itemName.trim())).length}{' '}
                consigliate
              </li>
              <li>
                <span className="text-slate-500">Companion:</span>{' '}
                {companionMode === 'build'
                  ? companionBuild?.title ?? 'non selezionato'
                  : companionItemName || 'non specificato'}
              </li>
            </ul>
            {notes && (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 mt-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-40"
        >
          Indietro
        </button>
        <div className="flex gap-2">
          {step < 5 ? (
            <button onClick={() => setStep((s) => Math.min(5, s + 1) as Step)} className="btn-primary">
              Avanti
            </button>
          ) : (
            <>
              <button onClick={() => persist('bozza')} disabled={saving} className="btn-secondary">
                Salva bozza
              </button>
              <button onClick={() => persist('pubblicata')} disabled={saving} className="btn-gold">
                {saving ? 'Salvataggio…' : 'Pubblica'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
  compact,
}: {
  mode: LinkMode;
  onChange: (m: LinkMode) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onChange('build')}
        className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
          mode === 'build'
            ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
            : 'border-base-600 text-slate-400'
        }`}
      >
        Build esistente
      </button>
      <button
        onClick={() => onChange('testo')}
        className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
          mode === 'testo'
            ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
            : 'border-base-600 text-slate-400'
        }`}
      >
        Solo nome
      </button>
    </div>
  );
}
