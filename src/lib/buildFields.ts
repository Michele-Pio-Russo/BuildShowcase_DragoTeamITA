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
 * - Companion e armi companion: solo gli slot mod base (Precept per il companion) — niente Aura/Exilus/Arcane/Focus/Archon/Stile
 */
export function getCategoryFieldFlags(slug: string | undefined): CategoryFieldFlags {
  const isWarframe = slug === 'warframe';
  const isMelee = slug === 'arma_melee';
  const isWeapon = slug === 'arma_primaria' || slug === 'arma_secondaria' || slug === 'arma_melee';

  return {
    showAura: isWarframe,
    showExilus: isWarframe || isWeapon,
    showArcane: isWarframe || isWeapon,
    showFocusSchool: isWarframe,
    showArchonShards: isWarframe,
    showStile: isMelee,
  };
}
