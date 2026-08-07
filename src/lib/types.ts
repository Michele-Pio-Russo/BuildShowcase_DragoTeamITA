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
  aura: string | null;
  exilus: string | null;
  arcane: string | null;
  focus_school: string | null;
  mods_image_url: string | null;
  stats: BuildStats;
  views_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  // relazioni opzionali popolate in query
  category?: Category;
  author?: Profile;
  mods?: BuildMod[];
  tags?: Tag[];
  is_favorite?: boolean;
}

export interface Comment {
  id: string;
  build_id: string;
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

export const CATEGORY_LABELS: Record<string, string> = {
  warframe: 'Warframe',
  arma_primaria: 'Arma primaria',
  arma_secondaria: 'Arma secondaria',
  arma_melee: 'Arma melee',
  companion: 'Companion',
  arma_companion: 'Arma del companion',
};
