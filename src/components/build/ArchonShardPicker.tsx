'use client';

import { useEffect, useState } from 'react';

type ShardColor = 'Crimson' | 'Amber' | 'Azure' | 'Emerald' | 'Topaz' | 'Violet';
type ShardTarget = 'Warframe' | 'Operatore/Drifter';

interface ShardRow {
  id: string;
  color: ShardColor;
  target: ShardTarget;
  effect: string;
  customEffect: string;
  tauforged: boolean;
  quantity: string;
}

const COLORS: ShardColor[] = ['Crimson', 'Amber', 'Azure', 'Emerald', 'Topaz', 'Violet'];
const TARGETS: ShardTarget[] = ['Warframe', 'Operatore/Drifter'];
const CUSTOM = 'Personalizzato…';

// Elenco indicativo degli effetti più comuni per colore/bersaglio.
// Digital Extremes aggiorna periodicamente il sistema delle Archon Shard:
// verifica sempre in gioco l'effetto esatto prima di affidarti a questa lista,
// e usa "Personalizzato…" se non trovi l'opzione corretta.
const EFFECTS: Record<ShardColor, Record<ShardTarget, string[]>> = {
  Crimson: {
    Warframe: ['Ability Strength +', 'Melee Damage +', 'Combo Duration +'],
    'Operatore/Drifter': ['Void Damage +', 'Amp Critical Chance +'],
  },
  Amber: {
    Warframe: ['Max Health +', 'Health Orb Effectiveness +'],
    'Operatore/Drifter': ['Max Health +', 'Void Regen +'],
  },
  Azure: {
    Warframe: ['Max Shield +', 'Max Energy +'],
    'Operatore/Drifter': ['Max Energy +', 'Void Dash Regen +'],
  },
  Emerald: {
    Warframe: ['Parkour Velocity +', 'Status Chance +'],
    'Operatore/Drifter': ['Ability Efficiency +', 'Void Mode Duration +'],
  },
  Topaz: {
    Warframe: ['Ability Range +', 'Ability Duration +'],
    'Operatore/Drifter': ['Amp Range +', 'Void Sling Range +'],
  },
  Violet: {
    Warframe: ['Health Regen +', 'Energy Regen +'],
    'Operatore/Drifter': ['Magazine Capacity +', 'Reload Speed +'],
  },
};

function emptyRow(): ShardRow {
  return {
    id: crypto.randomUUID(),
    color: 'Crimson',
    target: 'Warframe',
    effect: EFFECTS.Crimson.Warframe[0],
    customEffect: '',
    tauforged: false,
    quantity: '1',
  };
}

function buildSummary(rows: ShardRow[]): string {
  return rows
    .map((r) => {
      const effect = r.effect === CUSTOM ? r.customEffect.trim() : r.effect;
      if (!effect) return null;
      const tf = r.tauforged ? 'Tauforged ' : '';
      const qty = r.quantity && r.quantity !== '1' ? `${r.quantity}x ` : '';
      return `${qty}${tf}${r.color} (${r.target}) — ${effect}`;
    })
    .filter(Boolean)
    .join('; ');
}

export default function ArchonShardPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (summary: string) => void;
}) {
  // Il DB salva solo la stringa finale: se c'è già un valore testuale legacy
  // (da build create prima di questo componente) lo teniamo come promemoria
  // sola-lettura, e si parte con righe strutturate vuote.
  const [legacyText] = useState(value && !value.includes('—') ? value : null);
  const [rows, setRows] = useState<ShardRow[]>([]);

  useEffect(() => {
    onChange(buildSummary(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function update(id: string, patch: Partial<ShardRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleColorChange(id: string, color: ShardColor) {
    const row = rows.find((r) => r.id === id);
    const target = row?.target ?? 'Warframe';
    update(id, { color, effect: EFFECTS[color][target][0] });
  }

  function handleTargetChange(id: string, target: ShardTarget) {
    const row = rows.find((r) => r.id === id);
    const color = row?.color ?? 'Crimson';
    update(id, { target, effect: EFFECTS[color][target][0] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-300">Archon Shards consigliate</label>
        <button onClick={addRow} className="text-xs text-accent-400 hover:text-accent-300">
          + Aggiungi shard
        </button>
      </div>

      {legacyText && (
        <p className="text-xs text-slate-500 mb-2 italic">
          Valore precedente: &quot;{legacyText}&quot; — aggiungi righe qui sotto per sostituirlo.
        </p>
      )}

      <p className="text-xs text-slate-500 mb-3">
        Elenco indicativo degli effetti: verifica sempre in gioco l&apos;effetto esatto, gli
        sviluppatori aggiornano periodicamente il sistema. Usa &quot;Personalizzato…&quot; se non
        trovi l&apos;opzione giusta.
      </p>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
            <select
              className="input-base col-span-2 !text-xs"
              value={r.color}
              onChange={(e) => handleColorChange(r.id, e.target.value as ShardColor)}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="input-base col-span-2 !text-xs"
              value={r.target}
              onChange={(e) => handleTargetChange(r.id, e.target.value as ShardTarget)}
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="input-base col-span-3 !text-xs"
              value={r.effect}
              onChange={(e) => update(r.id, { effect: e.target.value })}
            >
              {EFFECTS[r.color][r.target].map((eff) => (
                <option key={eff} value={eff}>
                  {eff}
                </option>
              ))}
              <option value={CUSTOM}>{CUSTOM}</option>
            </select>
            {r.effect === CUSTOM && (
              <input
                className="input-base col-span-2 !text-xs"
                placeholder="Effetto personalizzato"
                value={r.customEffect}
                onChange={(e) => update(r.id, { customEffect: e.target.value })}
              />
            )}
            <input
              className={`input-base !text-xs ${r.effect === CUSTOM ? 'col-span-1' : 'col-span-2'}`}
              type="number"
              min={1}
              max={5}
              value={r.quantity}
              onChange={(e) => update(r.id, { quantity: e.target.value })}
              title="Quantità"
            />
            <label className="col-span-1 flex items-center gap-1 text-[10px] text-slate-400">
              <input
                type="checkbox"
                checked={r.tauforged}
                onChange={(e) => update(r.id, { tauforged: e.target.checked })}
              />
              TF
            </label>
            <button
              onClick={() => removeRow(r.id)}
              className="col-span-1 text-slate-500 hover:text-red-400 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-slate-600">Nessuna Archon Shard aggiunta.</p>
        )}
      </div>
    </div>
  );
}
