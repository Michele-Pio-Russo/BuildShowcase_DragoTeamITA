'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, BuildMod, Category, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Step = 1 | 2 | 3 | 4;

interface ModRow {
  id: string;
  mod_name: string;
  rank: string;
  slot: string;
  note: string;
}

const emptyMod = (): ModRow => ({
  id: crypto.randomUUID(),
  mod_name: '',
  rank: '',
  slot: '',
  note: '',
});

export default function BuildForm({ existingBuild }: { existingBuild?: Build }) {
  const supabase = createClient();
  const router = useRouter();
  const isEditing = !!existingBuild;

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Step 1
  const [title, setTitle] = useState(existingBuild?.title ?? '');
  const [categoryId, setCategoryId] = useState(existingBuild?.category_id ?? '');
  const [itemName, setItemName] = useState(existingBuild?.item_name ?? '');
  const [imageUrl, setImageUrl] = useState(existingBuild?.image_url ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Step 2
  const [modsInputMode, setModsInputMode] = useState<'testo' | 'immagine'>(
    existingBuild?.mods_image_url ? 'immagine' : 'testo'
  );
  const [mods, setMods] = useState<ModRow[]>([emptyMod()]);
  const [modsImageUrl, setModsImageUrl] = useState(existingBuild?.mods_image_url ?? '');
  const [modsImageFile, setModsImageFile] = useState<File | null>(null);
  const [forma, setForma] = useState(existingBuild?.forma ?? '');
  const [polarity, setPolarity] = useState(existingBuild?.polarity ?? '');
  const [reattore, setReattore] = useState(existingBuild?.reattore ?? false);
  const [aura, setAura] = useState(existingBuild?.aura ?? '');
  const [exilus, setExilus] = useState(existingBuild?.exilus ?? '');
  const [arcane, setArcane] = useState(existingBuild?.arcane ?? '');
  const [focusSchool, setFocusSchool] = useState(existingBuild?.focus_school ?? '');

  // Step 3
  const [description, setDescription] = useState(existingBuild?.description_md ?? '');
  const [playstyle, setPlaystyle] = useState(existingBuild?.playstyle_md ?? '');
  const [statCritica, setStatCritica] = useState(existingBuild?.stats?.critica ?? '');
  const [statStatus, setStatStatus] = useState(existingBuild?.stats?.status ?? '');
  const [statDanno, setStatDanno] = useState(existingBuild?.stats?.danno ?? '');
  const [statSopravvivenza, setStatSopravvivenza] = useState(existingBuild?.stats?.sopravvivenza ?? '');
  const [statEnergia, setStatEnergia] = useState(existingBuild?.stats?.energia ?? '');
  const [statRange, setStatRange] = useState(existingBuild?.stats?.range ?? '');
  const [statDurata, setStatDurata] = useState(existingBuild?.stats?.durata ?? '');
  const [statForza, setStatForza] = useState(existingBuild?.stats?.forza ?? '');
  const [statEfficienza, setStatEfficienza] = useState(existingBuild?.stats?.efficienza ?? '');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('ordine');
      setCategories(cats ?? []);
      const { data: tagList } = await supabase.from('tags').select('*').order('nome');
      setAllTags(tagList ?? []);

      if (existingBuild) {
        const { data: existingMods } = await supabase
          .from('build_mods')
          .select('*')
          .eq('build_id', existingBuild.id)
          .order('ordine');
        if (existingMods?.length) {
          setMods(
            (existingMods as BuildMod[]).map((m) => ({
              id: m.id,
              mod_name: m.mod_name,
              rank: m.rank?.toString() ?? '',
              slot: m.slot ?? '',
              note: m.note ?? '',
            }))
          );
        }
        const { data: existingTags } = await supabase
          .from('build_tags')
          .select('tag:tags(*)')
          .eq('build_id', existingBuild.id);
        setSelectedTags((existingTags ?? []).map((t: any) => t.tag?.nome).filter(Boolean));
      }
    })();
  }, [existingBuild]);

  function updateMod(id: string, field: keyof ModRow, value: string) {
    setMods((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function addMod() {
    setMods((prev) => [...prev, emptyMod()]);
  }

  function removeMod(id: string) {
    setMods((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleTag(name: string) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  function addCustomTag() {
    const clean = tagInput.trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return imageUrl || null;
    const ext = imageFile.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('build-images')
      .upload(path, imageFile);
    if (uploadError) {
      setError('Errore nel caricamento immagine: ' + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from('build-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadModsImageIfNeeded(): Promise<string | null> {
    if (!modsImageFile) return modsImageUrl || null;
    const ext = modsImageFile.name.split('.').pop();
    const path = `mods-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('build-images')
      .upload(path, modsImageFile);
    if (uploadError) {
      setError('Errore nel caricamento immagine mod: ' + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from('build-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function persist(status: 'bozza' | 'pubblicata') {
    setError(null);
    if (!title.trim() || !categoryId || !itemName.trim()) {
      setError('Titolo, categoria e nome oggetto sono obbligatori.');
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
    const finalModsImageUrl =
      modsInputMode === 'immagine' ? await uploadModsImageIfNeeded() : null;

    const stats = {
      critica: statCritica,
      status: statStatus,
      danno: statDanno,
      sopravvivenza: statSopravvivenza,
      energia: statEnergia,
      range: statRange,
      durata: statDurata,
      forza: statForza,
      efficienza: statEfficienza,
    };

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      item_name: itemName.trim(),
      image_url: finalImageUrl,
      status,
      description_md: description,
      playstyle_md: playstyle,
      forma: forma || null,
      polarity: polarity || null,
      reattore,
      aura: aura || null,
      exilus: exilus || null,
      arcane: arcane || null,
      focus_school: focusSchool || null,
      mods_image_url: finalModsImageUrl,
      stats,
    };

    let buildId = existingBuild?.id;

    if (isEditing && buildId) {
      const { error: updateError } = await supabase.from('builds').update(payload).eq('id', buildId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
      await supabase.from('build_mods').delete().eq('build_id', buildId);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('builds')
        .insert({ ...payload, author_id: user.id })
        .select()
        .single();
      if (insertError || !inserted) {
        setError(insertError?.message ?? 'Errore durante la creazione.');
        setSaving(false);
        return;
      }
      buildId = inserted.id;
    }

    if (modsInputMode === 'testo') {
      const modsToInsert = mods
        .filter((m) => m.mod_name.trim())
        .map((m, i) => ({
          build_id: buildId,
          mod_name: m.mod_name.trim(),
          rank: m.rank ? parseInt(m.rank, 10) : null,
          slot: m.slot || null,
          note: m.note || null,
          ordine: i,
        }));
      if (modsToInsert.length) {
        await supabase.from('build_mods').insert(modsToInsert);
      }
    }

    // tag: crea quelli mancanti, poi collega
    await supabase.from('build_tags').delete().eq('build_id', buildId);
    for (const tagName of selectedTags) {
      let { data: existingTag } = await supabase
        .from('tags')
        .select('*')
        .eq('nome', tagName)
        .maybeSingle();
      if (!existingTag) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ nome: tagName })
          .select()
          .single();
        existingTag = newTag;
      }
      if (existingTag) {
        await supabase.from('build_tags').insert({ build_id: buildId, tag_id: existingTag.id });
      }
    }

    setSaving(false);
    router.push(`/build/${buildId}`);
    router.refresh();
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Info base' },
    { n: 2, label: 'Mod & Forma' },
    { n: 3, label: 'Stats & Tag' },
    { n: 4, label: 'Anteprima' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">
        {isEditing ? 'Modifica build' : 'Nuova build'}
      </h1>

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
            <label className="block text-sm text-slate-300 mb-1">Titolo della build *</label>
            <input
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Saryn Spore Spam Steel Path"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Categoria *</label>
              <select
                className="input-base"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Seleziona…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {CATEGORY_LABELS[c.slug] ?? c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nome oggetto *</label>
              <input
                className="input-base"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="es. Saryn Prime"
              />
            </div>
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
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-300">Configurazione mod</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setModsInputMode('testo')}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    modsInputMode === 'testo'
                      ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                      : 'border-base-600 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Inserisci mod
                </button>
                <button
                  onClick={() => setModsInputMode('immagine')}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    modsInputMode === 'immagine'
                      ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                      : 'border-base-600 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Carica screenshot
                </button>
              </div>
            </div>

            {modsInputMode === 'testo' ? (
              <>
                <div className="flex justify-end mb-2">
                  <button onClick={addMod} className="text-xs text-accent-400 hover:text-accent-300">
                    + Aggiungi mod
                  </button>
                </div>
                <div className="space-y-2">
                  {mods.map((m) => (
                    <div key={m.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="input-base col-span-4"
                        placeholder="Nome mod"
                        value={m.mod_name}
                        onChange={(e) => updateMod(m.id, 'mod_name', e.target.value)}
                      />
                      <input
                        className="input-base col-span-2"
                        placeholder="Slot"
                        value={m.slot}
                        onChange={(e) => updateMod(m.id, 'slot', e.target.value)}
                      />
                      <input
                        className="input-base col-span-2"
                        placeholder="Rank"
                        type="number"
                        value={m.rank}
                        onChange={(e) => updateMod(m.id, 'rank', e.target.value)}
                      />
                      <input
                        className="input-base col-span-3"
                        placeholder="Note"
                        value={m.note}
                        onChange={(e) => updateMod(m.id, 'note', e.target.value)}
                      />
                      <button
                        onClick={() => removeMod(m.id)}
                        className="col-span-1 text-slate-500 hover:text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Carica uno screenshot dell&apos;intera configurazione (dal gioco o dall&apos;app
                  di terze parti che usi) al posto di inserire le mod una per una.
                </p>
                {(modsImageFile || modsImageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={modsImageFile ? URL.createObjectURL(modsImageFile) : modsImageUrl}
                    alt="Anteprima configurazione mod"
                    className="w-full max-h-64 object-contain rounded-lg border border-base-600 mb-3 bg-base-900"
                  />
                )}
                <label className="block text-sm text-slate-300 mb-1">Immagine (URL)</label>
                <input
                  className="input-base"
                  value={modsImageUrl}
                  onChange={(e) => setModsImageUrl(e.target.value)}
                  placeholder="https://…"
                />
                <p className="text-xs text-slate-500 mt-1">oppure carica un file:</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setModsImageFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-slate-400 mt-1"
                />
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Forma</label>
              <input className="input-base" value={forma} onChange={(e) => setForma(e.target.value)} placeholder="es. 3x V, 1x -" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Polarità</label>
              <input className="input-base" value={polarity} onChange={(e) => setPolarity(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Aura</label>
              <input className="input-base" value={aura} onChange={(e) => setAura(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Exilus</label>
              <input className="input-base" value={exilus} onChange={(e) => setExilus(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Arcane</label>
              <input className="input-base" value={arcane} onChange={(e) => setArcane(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Focus School</label>
              <input
                className="input-base"
                value={focusSchool}
                onChange={(e) => setFocusSchool(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={reattore} onChange={(e) => setReattore(e.target.checked)} />
            Reattore / Catalizzatore installato
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Descrizione (Markdown)</label>
            <textarea
              className="input-base min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi la build…"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Stile di gioco e casi d&apos;uso (Markdown)</label>
            <textarea
              className="input-base min-h-[100px]"
              value={playstyle}
              onChange={(e) => setPlaystyle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Statistiche / priorità</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatInput label="Critica" value={statCritica} onChange={setStatCritica} />
              <StatInput label="Status" value={statStatus} onChange={setStatStatus} />
              <StatInput label="Danno" value={statDanno} onChange={setStatDanno} />
              <StatInput label="Sopravvivenza" value={statSopravvivenza} onChange={setStatSopravvivenza} />
              <StatInput label="Energia" value={statEnergia} onChange={setStatEnergia} />
              <StatInput label="Range" value={statRange} onChange={setStatRange} />
              <StatInput label="Durata" value={statDurata} onChange={setStatDurata} />
              <StatInput label="Forza" value={statForza} onChange={setStatForza} />
              <StatInput label="Efficienza" value={statEfficienza} onChange={setStatEfficienza} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Tag</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allTags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.nome)}
                  className={`badge ${selectedTags.includes(t.nome) ? 'badge-gold' : ''}`}
                >
                  {t.nome}
                </button>
              ))}
              {selectedTags
                .filter((t) => !allTags.some((at) => at.nome === t))
                .map((t) => (
                  <button key={t} onClick={() => toggleTag(t)} className="badge badge-gold">
                    {t}
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-base"
                placeholder="Aggiungi tag personalizzato (es. Steel Path)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              />
              <button onClick={addCustomTag} className="btn-secondary shrink-0">
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-5">
          <p className="text-xs text-slate-500 mb-3">Anteprima — così apparirà la scheda build</p>
          <h2 className="text-xl font-semibold text-slate-100">{title || 'Titolo build'}</h2>
          <p className="text-sm text-slate-400 mb-4">{itemName || 'Nome oggetto'}</p>
          {description && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 mb-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((t) => (
              <span key={t} className="badge badge-gold">
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {modsInputMode === 'testo'
              ? `${mods.filter((m) => m.mod_name.trim()).length} mod inserite`
              : modsImageFile || modsImageUrl
              ? 'Screenshot configurazione mod allegato'
              : 'Nessuno screenshot mod caricato'}
          </p>
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
          {step < 4 ? (
            <button onClick={() => setStep((s) => Math.min(4, s + 1) as Step)} className="btn-primary">
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

function StatInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input className="input-base" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
