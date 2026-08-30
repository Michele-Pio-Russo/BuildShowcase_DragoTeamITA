export interface CategoryFieldFlags {
  showAura: boolean;
  showExilus: boolean;
  showArcane: boolean;
  showFocusSchool: boolean;
  showArchonShards: boolean;
  showStile: boolean;
}

/**
 * Ogni tipo di equipaggiamento ha slot di mod diversi:
 * - Warframe: Aura, Exilus (con Adapter), Arcane, Focus School (Operator), Archon Shards
 * - Armi primarie/secondarie: Exilus (con Exilus Weapon Adapter), Arcane (con Arcane Adapter). Niente Aura/Focus/Archon.
 * - Armi melee: come sopra + Stile (slot Stance, esclusivo del melee)
 * - Armi Exalted (Exalted Blade, Regulators, Talons, ecc.): hanno SEMPRE lo slot Arcane
 *   (aggiunto a tutte le Exalted Weapon); l'Exilus è specifico delle Exalted primarie/secondarie,
 *   ma essendo un'unica categoria lo mostriamo comunque come campo opzionale. Niente Aura/Focus/
 *   Archon/Stile (le Exalted melee usano lo stance dell'arma melee equipaggiata, non uno slot proprio).
 * - Companion e armi companion: solo gli slot mod base (Precept per il companion) — niente Aura/Exilus/Arcane/Focus/Archon/Stile
 * - Archgun, Archmelee e Archwing: solo gli 8 slot mod base, nessuno slot speciale (confermato dalla wiki ufficiale)
 */
export function getCategoryFieldFlags(slug: string | undefined): CategoryFieldFlags {
  const isWarframe = slug === 'warframe';
  const isMelee = slug === 'arma_melee';
  const isExalted = slug === 'arma_exalted';
  const isWeapon = slug === 'arma_primaria' || slug === 'arma_secondaria' || slug === 'arma_melee';

  return {
    showAura: isWarframe,
    showExilus: isWarframe || isWeapon || isExalted,
    showArcane: isWarframe || isWeapon || isExalted,
    showFocusSchool: isWarframe,
    showArchonShards: isWarframe,
    showStile: isMelee,
  };
}

export interface CategoryPlaceholders {
  title: string;
  itemName: string;
}

/** Placeholder di esempio realistici per ogni tipo, per guidare chi compila il form. */
export function getCategoryPlaceholders(slug: string | undefined): CategoryPlaceholders {
  switch (slug) {
    case 'warframe':
      return { title: 'es. Saryn Spore Spam Steel Path', itemName: 'es. Saryn Prime' };
    case 'arma_primaria':
      return { title: 'es. Braton Corrosivo Slash', itemName: 'es. Braton Prime' };
    case 'arma_secondaria':
      return { title: 'es. Lex Headshot Crit', itemName: 'es. Lex Prime' };
    case 'arma_melee':
      return { title: 'es. Nikana Combo Duration', itemName: 'es. Nikana Prime' };
    case 'arma_exalted':
      return { title: 'es. Exalted Blade Crit Build', itemName: 'es. Exalted Blade' };
    case 'companion':
      return { title: 'es. Panzer Tank Build', itemName: 'es. Panzer Vulpaphyla' };
    case 'arma_companion':
      return { title: 'es. Verglas Status Build', itemName: 'es. Verglas' };
    case 'archgun':
      return { title: 'es. Imperator Vandal Corpus Killer', itemName: 'es. Imperator Vandal' };
    case 'archmelee':
      return { title: 'es. Prisma Veritux Archwing Build', itemName: 'es. Prisma Veritux' };
    case 'archwing':
      return { title: 'es. Itzal Rush Build', itemName: 'es. Itzal' };
    default:
      return { title: 'es. Titolo della build', itemName: 'es. Nome oggetto' };
  }
}
