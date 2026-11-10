'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, Category, RailjackData, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import MarkdownText from '@/components/ui/MarkdownText';
import RailjackFields from './RailjackFields';
import { cleanRailjackData } from '@/lib/railjack';
import ArchonShardPicker from './ArchonShardPicker';
import BuildTypePicker from './BuildTypePicker';
import { getCategoryFieldFlags, getCategoryPlaceholders } from '@/lib/buildFields';

type Step = 1 | 2 | 3 | 4;

export default function BuildForm({ existingBuild }: { existingBuild?: Build }) {
  const supabase = createClient();
  const router = useRouter();
  const isEditing = !!existingBuild;

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Step 0 — scelta del tipo di build (solo in creazione)
  const [showForm, setShowForm] = useState(isEditing);
  const [pendingTypeSlug, setPendingTypeSlug] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState(existingBuild?.title ?? '');
  const [categoryId, setCategoryId] = useState(existingBuild?.category_id ?? '');
  const [itemName, setItemName] = useState(existingBuild?.item_name ?? '');
  const [imageUrl, setImageUrl] = useState(existingBuild?.image_url ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Step 2 — mod: uno o più screenshot con didascalia, più i campi specifici del tipo
  type ModImageEntry = { key: string; id?: string; file: File | null; url: string; caption: string };
  const [modImages, setModImages] = useState<ModImageEntry[]>(
    existingBuild?.mods_image_url
      ? [{ key: 'legacy', file: null, url: existingBuild.mods_image_url, caption: '' }]
      : isEditing
        ? []
        : [{ key: crypto.randomUUID(), file: null, url: '', caption: '' }]
  );
  const [forma, setForma] = useState(existingBuild?.forma ?? '');
  const [stile, setStile] = useState(existingBuild?.stile ?? '');
  const [aura, setAura] = useState(existingBuild?.aura ?? '');
  const [exilus, setExilus] = useState(existingBuild?.exilus ?? '');
  const [arcane, setArcane] = useState(existingBuild?.arcane ?? '');
  const [focusSchool, setFocusSchool] = useState(existingBuild?.focus_school ?? '');
  const [archonShards, setArchonShards] = useState(existingBuild?.archon_shards ?? '');
  const [railjack, setRailjack] = useState<RailjackData>(existingBuild?.railjack ?? {});

  // Step 3
  const [description, setDescription] = useState(existingBuild?.description_md ?? '');
  const [playstyle, setPlaystyle] = useState(existingBuild?.playstyle_md ?? '');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('ordine');
      setCategories(cats ?? []);
      const { data: tagList } = await supabase.from('tags').select('*').order('nome');
      setAllTags(tagList ?? []);

      if (existingBuild) {
        const { data: existingTags } = await supabase
          .from('build_tags')
          .select('tag:tags(*)')
          .eq('build_id', existingBuild.id);
        setSelectedTags((existingTags ?? []).map((t: any) => t.tag?.nome).filter(Boolean));

        const { data: existingModImages } = await supabase
          .from('build_mod_images')
          .select('*')
          .eq('build_id', existingBuild.id)
          .order('ordine');
        if (existingModImages && existingModImages.length > 0) {
          setModImages(
            existingModImages.map((mi: any) => ({
              key: mi.id,
              id: mi.id,
              file: null,
              url: mi.image_url,
              caption: mi.caption ?? '',
            }))
          );
        }
      }
    })();
  }, [existingBuild]);

  // Una volta arrivate le categorie, risolvo lo slug scelto nello step 0 nell'id categoria reale
  useEffect(() => {
    if (pendingTypeSlug && categories.length > 0) {
      const found = categories.find((c) => c.slug === pendingTypeSlug);
      if (found) {
        setCategoryId(found.id);
        setShowForm(true);
        setPendingTypeSlug(null);
      }
    }
  }, [pendingTypeSlug, categories]);

  function chooseType(slug: string) {
    const found = categories.find((c) => c.slug === slug);
    if (found) {
      setCategoryId(found.id);
      setShowForm(true);
    } else {
      // categorie non ancora caricate: le risolvo appena arrivano
      setPendingTypeSlug(slug);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const fieldFlags = getCategoryFieldFlags(selectedCategory?.slug);
  const placeholders = getCategoryPlaceholders(selectedCategory?.slug);

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

  function addModImageSlot() {
    setModImages((prev) => [...prev, { key: crypto.randomUUID(), file: null, url: '', caption: '' }]);
  }

  function removeModImage(key: string) {
    setModImages((prev) => prev.filter((m) => m.key !== key));
  }

  function updateModImageUrl(key: string, url: string) {
    setModImages((prev) =>
      prev.map((m) => (m.key === key ? { ...m, url, file: url ? null : m.file } : m))
    );
  }

  function updateModImageFile(key: string, file: File | null) {
    setModImages((prev) => prev.map((m) => (m.key === key ? { ...m, file } : m)));
  }

  function updateModImageCaption(key: string, caption: string) {
    setModImages((prev) => prev.map((m) => (m.key === key ? { ...m, caption } : m)));
  }

  async function uploadModImages(): Promise<{ url: string; caption: string }[]> {
    const results: { url: string; caption: string }[] = [];
    for (const entry of modImages) {
      if (entry.file) {
        const ext = entry.file.name.split('.').pop();
        const path = `mods-${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('build-images')
          .upload(path, entry.file);
        if (uploadError) {
          setError('Errore nel caricamento di uno screenshot mod: ' + uploadError.message);
          continue;
        }
        const { data } = supabase.storage.from('build-images').getPublicUrl(path);
        results.push({ url: data.publicUrl, caption: entry.caption });
      } else if (entry.url) {
        results.push({ url: entry.url, caption: entry.caption });
      }
    }
    return results;
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

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      item_name: itemName.trim(),
      image_url: finalImageUrl,
      status,
      description_md: description,
      playstyle_md: playstyle,
      forma: forma || null,
      stile: stile || null,
      aura: aura || null,
      exilus: exilus || null,
      arcane: arcane || null,
      focus_school: focusSchool || null,
      archon_shards: archonShards || null,
      ...(fieldFlags.showRailjack
        ? { railjack: cleanRailjackData(railjack) }
        : existingBuild?.railjack
          ? { railjack: null }
          : {}),
    };

    let buildId = existingBuild?.id;

    if (isEditing && buildId) {
      const { error: updateError } = await supabase.from('builds').update(payload).eq('id', buildId);
      if (updateError) {
        console.error('Errore aggiornamento build:', updateError);
        setError(
          `Errore durante il salvataggio: ${updateError.message} (codice: ${
            updateError.code ?? '—'
          }). Se il messaggio riguarda una colonna sconosciuta, verifica di aver eseguito tutte le migrazioni SQL su Supabase.`
        );
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('builds')
        .insert({ ...payload, author_id: user.id })
        .select()
        .single();
      if (insertError || !inserted) {
        console.error('Errore creazione build:', insertError);
        setError(
          `Errore durante la creazione: ${insertError?.message ?? 'nessun dettaglio'} (codice: ${
            insertError?.code ?? '—'
          }). Se il messaggio riguarda una colonna o tabella sconosciuta, verifica di aver eseguito tutte le migrazioni SQL su Supabase.`
        );
        setSaving(false);
        return;
      }
      buildId = inserted.id;
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

    // galleria immagini mod: sostituisco tutte le voci con quelle correnti
    const uploadedModImages = await uploadModImages();
    await supabase.from('build_mod_images').delete().eq('build_id', buildId);
    if (uploadedModImages.length > 0) {
      await supabase.from('build_mod_images').insert(
        uploadedModImages.map((img, idx) => ({
          build_id: buildId,
          image_url: img.url,
          caption: img.caption || null,
          ordine: idx,
        }))
      );
    }

    setSaving(false);
    router.push(`/build/${buildId}`);
    router.refresh();
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Info base' },
    { n: 2, label: 'Mod & Forma' },
    { n: 3, label: 'Descrizione & Tag' },
    { n: 4, label: 'Anteprima' },
  ];

  const mainImagePreview = imageFile ? URL.createObjectURL(imageFile) : imageUrl;

  if (!showForm) {
    return <BuildTypePicker onChoose={chooseType} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      {!isEditing && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(false)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ← Torna alle build
          </button>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-slate-100 mb-1">
        {isEditing
          ? 'Modifica build'
          : `Nuova build ${CATEGORY_LABELS[selectedCategory?.slug ?? ''] ?? selectedCategory?.label ?? ''}`}
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
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4 whitespace-pre-wrap">
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
              placeholder={placeholders.title}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Categoria *</label>
              {isEditing ? (
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
              ) : (
                <div className="input-base flex items-center justify-between">
                  <span>{CATEGORY_LABELS[selectedCategory?.slug ?? ''] ?? selectedCategory?.label}</span>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs text-accent-300 hover:underline shrink-0 ml-2"
                  >
                    Cambia tipo
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nome oggetto *</label>
              <input
                className="input-base"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={placeholders.itemName}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Immagine</label>
            {mainImagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImagePreview}
                alt="Anteprima immagine build"
                className="w-full max-h-56 object-contain rounded-lg border border-base-600 mb-2 bg-base-900"
              />
            )}
            <input
              className="input-base"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) setImageFile(null);
              }}
              placeholder="https://…"
            />
            <p className="text-xs text-slate-500 mt-1">oppure carica un file:</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-400 mt-1"
            />
            {(imageFile || imageUrl) && (
              <p className="text-xs text-emerald-400/80 mt-1">
                ✓ Immagine selezionata — resta collegata anche cambiando schermata.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Configurazione mod</label>
            <p className="text-xs text-slate-500 mb-3">
              Carica uno o più screenshot (es. build diverse per situazioni diverse), ognuno con la
              sua didascalia — come quando pubblichi build su Discord.
            </p>
            <div className="space-y-4">
              {modImages.map((entry, idx) => (
                <div key={entry.key} className="border border-base-600 rounded-lg p-3 space-y-2">
                  {(entry.file || entry.url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.file ? URL.createObjectURL(entry.file) : entry.url}
                      alt={`Screenshot mod ${idx + 1}`}
                      className="w-full max-h-64 object-contain rounded-lg bg-base-900"
                    />
                  )}
                  <input
                    className="input-base"
                    value={entry.url}
                    onChange={(e) => updateModImageUrl(entry.key, e.target.value)}
                    placeholder="https://…"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateModImageFile(entry.key, e.target.files?.[0] ?? null)}
                    className="text-xs text-slate-400"
                  />
                  <input
                    className="input-base"
                    value={entry.caption}
                    onChange={(e) => updateModImageCaption(entry.key, e.target.value)}
                    placeholder='Didascalia (es. "Build A — per il corrosivo")'
                  />
                  <button
                    type="button"
                    onClick={() => removeModImage(entry.key)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Rimuovi immagine
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addModImageSlot} className="btn-secondary mt-3">
              + Aggiungi immagine
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-base-700">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Forma</label>
              <input
                className="input-base"
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                placeholder="es. 3x V, 1x -"
              />
            </div>
            {fieldFlags.showStile && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Stile</label>
                <input
                  className="input-base"
                  value={stile}
                  onChange={(e) => setStile(e.target.value)}
                  placeholder="es. Tempo Royale"
                />
              </div>
            )}
            {fieldFlags.showAura && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Aura</label>
                <input className="input-base" value={aura} onChange={(e) => setAura(e.target.value)} />
              </div>
            )}
            {fieldFlags.showExilus && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Exilus</label>
                <input className="input-base" value={exilus} onChange={(e) => setExilus(e.target.value)} />
              </div>
            )}
            {fieldFlags.showArcane && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Arcane</label>
                <input className="input-base" value={arcane} onChange={(e) => setArcane(e.target.value)} />
              </div>
            )}
            {fieldFlags.showFocusSchool && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Focus School consigliata</label>
                <input
                  className="input-base"
                  value={focusSchool}
                  onChange={(e) => setFocusSchool(e.target.value)}
                />
              </div>
            )}
          </div>

          {fieldFlags.showArchonShards && (
            <div className="pt-2 border-t border-base-700">
              <ArchonShardPicker value={archonShards} onChange={setArchonShards} />
            </div>
          )}

          {fieldFlags.showRailjack && (
            <div className="pt-2 border-t border-base-700">
              <RailjackFields value={railjack} onChange={setRailjack} />
            </div>
          )}
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
          {mainImagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImagePreview}
              alt="Anteprima immagine build"
              className="w-full max-h-56 object-contain rounded-lg border border-base-600 mb-3 bg-base-900"
            />
          )}
          <h2 className="text-xl font-semibold text-slate-100">{title || 'Titolo build'}</h2>
          <p className="text-sm text-slate-400 mb-4">{itemName || 'Nome oggetto'}</p>
          {description && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 mb-3">
              <MarkdownText text={description} />
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
            {modImages.length > 0
              ? `${modImages.length} screenshot configurazione mod allegati`
              : 'Nessuno screenshot mod caricato'}
          </p>
          {fieldFlags.showRailjack && (
            <p className="text-xs text-slate-500 mt-1">
              {(() => {
                const d = cleanRailjackData(railjack);
                const nComponents = Object.keys(d?.components ?? {}).length;
                const nArmaments = Object.keys(d?.armaments ?? {}).length;
                const nCrew = d?.crew?.length ?? 0;
                return `Componenti: ${nComponents}/4 · Artiglieria: ${nArmaments}/3 · Equipaggio: ${nCrew}`;
              })()}
            </p>
          )}
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
