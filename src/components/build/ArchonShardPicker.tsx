'use client';

import { useEffect, useState } from 'react';

type ShardColor = 'Crimson' | 'Amber' | 'Azure' | 'Topaz' | 'Violet' | 'Emerald';

interface ShardRow {
  id: string;
  color: ShardColor;
  effect: string;
  customEffect: string;
  tauforged: boolean;
  quantity: string;
}

const COLORS: ShardColor[] = ['Crimson', 'Amber', 'Azure', 'Topaz', 'Violet', 'Emerald'];
const CUSTOM = 'Personalizzato…';

// Effetti reali per colore, dalla wiki ufficiale di Warframe (wiki.warframe.com).
// Il valore tra parentesi è il bonus della variante Tauforged.
const EFFECTS: Record<ShardColor, string[]> = {
  Crimson: [
    'Melee Critical Damage +25% (+37.5%)',
    'Primary Status Chance +25% (+37.5%)',
    'Secondary Critical Chance +25% (+37.5%)',
    'Ability Strength +10% (+15%)',
    'Ability Duration +10% (+15%)',
  ],
  Amber: [
    'Max Energy filled on Spawn +30% (+45%)',
    'Effectiveness on Health Orbs +100% (+150%)',
    'Effectiveness on Energy Orbs +50% (+75%)',
    'Casting Speed +25% (+37.5%)',
    'Parkour Velocity +15% (+22.5%)',
  ],
  Azure: [
    'Max Health +150 (+225)',
    'Shield Capacity +150 (+225)',
    'Max Energy +50 (+75)',
    'Armor +150 (+225)',
    'Health Regeneration +5/s (+7.5/s)',
  ],
  Topaz: [
    'Health per kill con danno Blast (max 300 / 450)',
    'Rigenera Scudo su kill con danno Blast (+5 / +7.5)',
    'Secondary Critical Chance per kill con status Heat (max +50% / +75%)',
    'Ability Damage +10% (+15%) su nemici con status Radiation',
  ],
  Violet: [
    'Ability Damage +10% (+15%) su nemici con status Electricity',
    'Primary Electricity Damage +30% (+45%), + bonus per shard Crimson/Azure/Violet equipaggiate',
    'Melee Critical Damage +25% (+37.5%), raddoppia con Energia Max > 500',
    'Health Orb danno Energia, Energy Orb danno Health (+20% / +30%)',
  ],
  Emerald: [
    'Danno da status Toxin +30% (+45%)',
    'Recupera Health per tick di status Toxin (+2 / +3)',
    'Ability Damage +10% (+15%) su nemici con status Corrosion',
    'Stack massimi di Corrosion +2 (+3)',
  ],
};

function emptyRow(): ShardRow {
  return {
    id: crypto.randomUUID(),
    color: 'Crimson',
    effect: EFFECTS.Crimson[0],
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
      return `${qty}${tf}${r.color} — ${effect}`;
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
    update(id, { color, effect: EFFECTS[color][0] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-300">
          Archon Shards consigliate <span className="text-slate-500">(solo Warframe)</span>
        </label>
        <button onClick={addRow} className="text-xs text-accent-400 hover:text-accent-300">
          + Aggiungi shard
        </button>
      </div>

      {legacyText && (
        <p className="text-xs text-slate-500 mb-2 italic">
          Valore precedente: &quot;{legacyText}&quot; — aggiungi righe qui sotto per sostituirlo.
        </p>
      )}

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
              className={`input-base !text-xs ${
                r.effect === CUSTOM ? 'col-span-5' : 'col-span-6'
              }`}
              value={r.effect}
              onChange={(e) => update(r.id, { effect: e.target.value })}
            >
              {EFFECTS[r.color].map((eff) => (
                <option key={eff} value={eff}>
                  {eff}
                </option>
              ))}
              <option value={CUSTOM}>{CUSTOM}</option>
            </select>
            {r.effect === CUSTOM && (
              <input
                className="input-base col-span-3 !text-xs"
                placeholder="Effetto personalizzato"
                value={r.customEffect}
                onChange={(e) => update(r.id, { customEffect: e.target.value })}
              />
            )}
            <input
              className="input-base col-span-1 !text-xs"
              type="number"
              min={1}
              max={5}
              value={r.quantity}
              onChange={(e) => update(r.id, { quantity: e.target.value })}
              title="Quantità"
            />
            <label className="col-span-2 flex items-center gap-1 text-[10px] text-slate-400">
              <input
                type="checkbox"
                checked={r.tauforged}
                onChange={(e) => update(r.id, { tauforged: e.target.checked })}
              />
              Tauforged
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
