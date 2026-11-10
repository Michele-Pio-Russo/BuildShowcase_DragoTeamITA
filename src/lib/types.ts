export type UserRole = 'admin' | 'editor' | 'membro';
export type UserStatus = 'pending' | 'approvato' | 'rifiutato';
export type BuildStatus = 'bozza' | 'pubblicata';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  ordine: number;
}

export interface Tag {
  id: string;
  nome: string;
}

export interface BuildMod {
  id: string;
  build_id: string;
  mod_name: string;
  rank: number | null;
  slot: string | null;
  note: string | null;
  ordine: number;
}

export interface BuildModImage {
  id: string;
  build_id: string;
  image_url: string;
  caption: string | null;
  ordine: number;
}

export interface BuildStats {
  critica?: string;
  status?: string;
  danno?: string;
  sopravvivenza?: string;
  energia?: string;
  range?: string;
  durata?: string;
  forza?: string;
  efficienza?: string;
  [key: string]: string | undefined;
}

// ---------- Railjack: dati strutturati oltre alla configurazione mod (Plexus) ----------
export type RailjackCrewRole = 'pilota' | 'gunner' | 'ingegnere' | 'difensore';

export interface RailjackCrewMember {
  role: RailjackCrewRole;
  name?: string;
  note?: string;
}

export interface RailjackData {
  /** Le 4 categorie di componenti della nave */
  components?: { shield_array?: string; engines?: string; plating?: string; reactor?: string };
  /** I 3 slot di artiglieria: arma del pilota (Nose Turret), torrette di bordo (Swivel), Ordnance */
  armaments?: { pilota?: string; torrette?: string; ordnance?: string };
  crew?: RailjackCrewMember[];
}

export interface Build {
  id: string;
  title: string;
  category_id: string;
  item_name: string;
  image_url: string | null;
  author_id: string;
  status: BuildStatus;
  description_md: string;
  playstyle_md: string;
  forma: string | null;
  polarity: string | null;
  reattore: boolean;
  stile: string | null;
  aura: string | null;
  exilus: string | null;
  arcane: string | null;
  focus_school: string | null;
  archon_shards: string | null;
  mods_image_url: string | null;
  railjack: RailjackData | null;
  stats: BuildStats;
  views_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  // relazioni opzionali popolate in query
  category?: Category;
  author?: Profile;
  mods?: BuildMod[];
  mod_images?: BuildModImage[];
  tags?: Tag[];
  is_favorite?: boolean;
}

export interface Comment {
  id: string;
  build_id: string | null;
  loadout_id: string | null;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface BuildHistoryEntry {
  id: string;
  build_id: string;
  editor_id: string;
  changed_at: string;
  diff_summary: string | null;
  editor?: Profile;
}

export type WeaponSlot = 'primaria' | 'secondaria' | 'melee' | 'exalted';

export interface LoadoutWeapon {
  id: string;
  loadout_id: string;
  slot: WeaponSlot;
  build_id: string | null;
  item_name: string | null;
  ordine: number;
  build?: Build;
}

export interface Loadout {
  id: string;
  title: string;
  author_id: string;
  status: BuildStatus;
  image_url: string | null;
  notes_md: string;
  warframe_build_id: string | null;
  warframe_item_name: string | null;
  warframe_forma: string | null;
  warframe_polarity: string | null;
  warframe_aura: string | null;
  warframe_exilus: string | null;
  warframe_arcane: string | null;
  warframe_archon_shards: string | null;
  warframe_focus_school: string | null;
  companion_build_id: string | null;
  companion_item_name: string | null;
  companion_weapon_build_id: string | null;
  companion_weapon_item_name: string | null;
  saves_count: number;
  created_at: string;
  updated_at: string;
  // relazioni opzionali popolate in query
  author?: Profile;
  warframe_build?: Build;
  companion_build?: Build;
  companion_weapon_build?: Build;
  weapons?: LoadoutWeapon[];
  is_favorite?: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  warframe: 'Warframe',
  arma_primaria: 'Arma primaria',
  arma_secondaria: 'Arma secondaria',
  arma_melee: 'Arma melee',
  arma_exalted: 'Arma Exalted',
  companion: 'Companion',
  arma_companion: 'Arma del companion',
  archgun: 'Archgun',
  archmelee: 'Archmelee',
  archwing: 'Archwing',
  necramech: 'Necramech',
  k_drive: 'K-Drive',
  railjack: 'Railjack',
};
