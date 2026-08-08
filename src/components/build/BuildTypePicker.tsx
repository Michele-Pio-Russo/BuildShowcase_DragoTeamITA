'use client';

const TYPE_OPTIONS: { slug: string; label: string; hint: string }[] = [
  { slug: 'warframe', label: 'Warframe', hint: 'Aura, Exilus, Arcane, Focus School, Archon Shards' },
  { slug: 'arma_primaria', label: 'Arma primaria', hint: 'Exilus, Arcane' },
  { slug: 'arma_secondaria', label: 'Arma secondaria', hint: 'Exilus, Arcane' },
  { slug: 'arma_melee', label: 'Arma melee', hint: 'Exilus, Arcane, Stile' },
  { slug: 'companion', label: 'Companion', hint: 'Solo mod base' },
  { slug: 'arma_companion', label: 'Arma del companion', hint: 'Solo mod base' },
];

export default function BuildTypePicker({ onChoose }: { onChoose: (slug: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Nuova build</h1>
      <p className="text-slate-400 text-sm mb-6">
        Che tipo di build vuoi creare? I campi della sezione Mod cambiano in base al tipo.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t.slug}
            onClick={() => onChoose(t.slug)}
            className="card p-4 text-left hover:border-accent-500/50 border border-transparent transition-colors"
          >
            <p className="text-slate-100 font-medium">{t.label}</p>
            <p className="text-xs text-slate-500 mt-1">{t.hint}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
