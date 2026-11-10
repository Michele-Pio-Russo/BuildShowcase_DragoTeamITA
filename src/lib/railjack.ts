import type { RailjackCrewRole, RailjackData } from '@/lib/types';

export type RailjackComponentKey = 'shield_array' | 'engines' | 'plating' | 'reactor';
export type RailjackArmamentKey = 'pilota' | 'torrette' | 'ordnance';

/** Le 4 categorie di componenti del Railjack (nomi del gioco). */
export const RAILJACK_COMPONENT_LABELS: Record<RailjackComponentKey, string> = {
  shield_array: 'Shield Array',
  engines: 'Engines',
  plating: 'Plating',
  reactor: 'Reactor',
};

export const RAILJACK_COMPONENT_PLACEHOLDERS: Record<RailjackComponentKey, string> = {
  shield_array: 'es. Zetki Shield Array Mk III',
  engines: 'es. Vidar Engines Mk III',
  plating: 'es. Vidar Plating Mk III',
  reactor: 'es. Zetki Reactor Mk III',
};

/**
 * I 3 slot di artiglieria (Armaments): il primo è l'arma del pilota (Nose Turret),
 * il secondo le torrette dorsale/ventrale usate dall'equipaggio (Swivel Turrets),
 * il terzo l'arma alternativa del pilota (Ordnance).
 */
export const RAILJACK_ARMAMENT_LABELS: Record<RailjackArmamentKey, string> = {
  pilota: 'Arma del pilota (Nose Turret)',
  torrette: 'Torrette dorsale/ventrale (Swivel)',
  ordnance: 'Ordnance',
};

export const RAILJACK_ARMAMENT_PLACEHOLDERS: Record<RailjackArmamentKey, string> = {
  pilota: 'es. Lavan Talyn Mk III',
  torrette: 'es. Vidar Apoc Mk III',
  ordnance: 'es. Tycho Seeker Mk III',
};

/** Ruoli che si possono assegnare ai membri dell'equipaggio. */
export const RAILJACK_CREW_ROLE_LABELS: Record<RailjackCrewRole, string> = {
  pilota: 'Pilota',
  gunner: 'Gunner',
  ingegnere: 'Ingegnere',
  difensore: 'Difensore',
};

export const RAILJACK_MAX_CREW = 8;

const COMPONENT_KEYS = Object.keys(RAILJACK_COMPONENT_LABELS) as RailjackComponentKey[];
const ARMAMENT_KEYS = Object.keys(RAILJACK_ARMAMENT_LABELS) as RailjackArmamentKey[];

/**
 * Ripulisce i dati prima di salvarli: toglie spazi e campi vuoti.
 * Restituisce null se non c'è nessun dato (così sul database non resta un oggetto vuoto).
 */
export function cleanRailjackData(data: RailjackData | null | undefined): RailjackData | null {
  if (!data) return null;
  const trim = (v?: string) => (v ?? '').trim();

  const components: NonNullable<RailjackData['components']> = {};
  for (const key of COMPONENT_KEYS) {
    const v = trim(data.components?.[key]);
    if (v) components[key] = v;
  }

  const armaments: NonNullable<RailjackData['armaments']> = {};
  for (const key of ARMAMENT_KEYS) {
    const v = trim(data.armaments?.[key]);
    if (v) armaments[key] = v;
  }

  const crew = (data.crew ?? []).slice(0, RAILJACK_MAX_CREW).map((m) => {
    const member: NonNullable<RailjackData['crew']>[number] = { role: m.role };
    const name = trim(m.name);
    const note = trim(m.note);
    if (name) member.name = name;
    if (note) member.note = note;
    return member;
  });

  const result: RailjackData = {};
  if (Object.keys(components).length) result.components = components;
  if (Object.keys(armaments).length) result.armaments = armaments;
  if (crew.length) result.crew = crew;
  return Object.keys(result).length ? result : null;
}

export function hasRailjackData(data: RailjackData | null | undefined): boolean {
  return cleanRailjackData(data) !== null;
}
