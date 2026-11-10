'use client';

import type { RailjackCrewRole, RailjackData } from '@/lib/types';
import {
  RAILJACK_ARMAMENT_LABELS,
  RAILJACK_ARMAMENT_PLACEHOLDERS,
  RAILJACK_COMPONENT_LABELS,
  RAILJACK_COMPONENT_PLACEHOLDERS,
  RAILJACK_CREW_ROLE_LABELS,
  RAILJACK_MAX_CREW,
  type RailjackArmamentKey,
  type RailjackComponentKey,
} from '@/lib/railjack';

const COMPONENT_KEYS = Object.keys(RAILJACK_COMPONENT_LABELS) as RailjackComponentKey[];
const ARMAMENT_KEYS = Object.keys(RAILJACK_ARMAMENT_LABELS) as RailjackArmamentKey[];
const ROLES = Object.keys(RAILJACK_CREW_ROLE_LABELS) as RailjackCrewRole[];

export default function RailjackFields({
  value,
  onChange,
}: {
  value: RailjackData;
  onChange: (v: RailjackData) => void;
}) {
  const crew = value.crew ?? [];

  function setComponent(key: RailjackComponentKey, text: string) {
    onChange({ ...value, components: { ...value.components, [key]: text } });
  }

  function setArmament(key: RailjackArmamentKey, text: string) {
    onChange({ ...value, armaments: { ...value.armaments, [key]: text } });
  }

  function updateMember(index: number, patch: Partial<{ role: RailjackCrewRole; name: string; note: string }>) {
    onChange({ ...value, crew: crew.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  }

  function addMember() {
    if (crew.length >= RAILJACK_MAX_CREW) return;
    onChange({ ...value, crew: [...crew, { role: 'gunner' }] });
  }

  function removeMember(index: number) {
    onChange({ ...value, crew: crew.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-1">Componenti</h3>
        <p className="text-xs text-slate-500 mb-3">
          Scrivi il nome completo come compare nel gioco, con casa e livello (es. Zetki … Mk III).
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {COMPONENT_KEYS.map((key) => (
            <div key={key}>
              <label className="block text-sm text-slate-300 mb-1">{RAILJACK_COMPONENT_LABELS[key]}</label>
              <input
                className="input-base"
                value={value.components?.[key] ?? ''}
                onChange={(e) => setComponent(key, e.target.value)}
                placeholder={RAILJACK_COMPONENT_PLACEHOLDERS[key]}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-1">Artiglieria</h3>
        <p className="text-xs text-slate-500 mb-3">I tre slot di Armaments del Railjack.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {ARMAMENT_KEYS.map((key) => (
            <div key={key}>
              <label className="block text-sm text-slate-300 mb-1">{RAILJACK_ARMAMENT_LABELS[key]}</label>
              <input
                className="input-base"
                value={value.armaments?.[key] ?? ''}
                onChange={(e) => setArmament(key, e.target.value)}
                placeholder={RAILJACK_ARMAMENT_PLACEHOLDERS[key]}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-1">Equipaggio</h3>
        <p className="text-xs text-slate-500 mb-3">
          Aggiungi i membri dell&apos;equipaggio con il ruolo che hanno nella build (massimo {RAILJACK_MAX_CREW}).
        </p>
        <div className="space-y-3">
          {crew.map((member, index) => (
            <div key={index} className="border border-base-600 rounded-lg p-3 grid sm:grid-cols-[10rem_1fr_1fr_auto] gap-2 items-center">
              <select
                className="input-base"
                value={member.role}
                onChange={(e) => updateMember(index, { role: e.target.value as RailjackCrewRole })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {RAILJACK_CREW_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <input
                className="input-base"
                value={member.name ?? ''}
                onChange={(e) => updateMember(index, { name: e.target.value })}
                placeholder="Nome del membro"
              />
              <input
                className="input-base"
                value={member.note ?? ''}
                onChange={(e) => updateMember(index, { note: e.target.value })}
                placeholder="Note (es. tratto Elite, intrinseci)"
              />
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-xs text-red-400 hover:underline justify-self-start"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        {crew.length < RAILJACK_MAX_CREW && (
          <button type="button" onClick={addMember} className="btn-secondary mt-3">
            + Aggiungi membro
          </button>
        )}
      </div>
    </div>
  );
}
