import type { RailjackData } from '@/lib/types';
import {
  RAILJACK_ARMAMENT_LABELS,
  RAILJACK_COMPONENT_LABELS,
  RAILJACK_CREW_ROLE_LABELS,
  cleanRailjackData,
  type RailjackArmamentKey,
  type RailjackComponentKey,
} from '@/lib/railjack';

const COMPONENT_KEYS = Object.keys(RAILJACK_COMPONENT_LABELS) as RailjackComponentKey[];
const ARMAMENT_KEYS = Object.keys(RAILJACK_ARMAMENT_LABELS) as RailjackArmamentKey[];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-100">{value}</p>
    </div>
  );
}

/** Mostra componenti, artiglieria ed equipaggio di una build Railjack (solo le parti compilate). */
export default function RailjackSection({ data }: { data: RailjackData | null | undefined }) {
  const d = cleanRailjackData(data);
  if (!d) return null;

  const components = COMPONENT_KEYS.filter((k) => d.components?.[k]);
  const armaments = ARMAMENT_KEYS.filter((k) => d.armaments?.[k]);
  const crew = d.crew ?? [];

  return (
    <section className="mb-6 space-y-5">
      {components.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-100 mb-2">Componenti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {components.map((k) => (
              <Row key={k} label={RAILJACK_COMPONENT_LABELS[k]} value={d.components![k]!} />
            ))}
          </div>
        </div>
      )}

      {armaments.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-100 mb-2">Artiglieria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {armaments.map((k) => (
              <Row key={k} label={RAILJACK_ARMAMENT_LABELS[k]} value={d.armaments![k]!} />
            ))}
          </div>
        </div>
      )}

      {crew.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-100 mb-2">Equipaggio</h2>
          <div className="space-y-2">
            {crew.map((m, i) => (
              <div key={i} className="card px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="badge badge-gold">{RAILJACK_CREW_ROLE_LABELS[m.role] ?? m.role}</span>
                {m.name && <span className="text-sm text-slate-100">{m.name}</span>}
                {m.note && <span className="text-sm text-slate-400">{m.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
