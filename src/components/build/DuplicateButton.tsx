'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, BuildMod } from '@/lib/types';

export default function DuplicateButton({ build, mods }: { build: Build; mods: BuildMod[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newBuild, error } = await supabase
      .from('builds')
      .insert({
        title: `${build.title} (copia)`,
        category_id: build.category_id,
        item_name: build.item_name,
        image_url: build.image_url,
        author_id: user.id,
        status: 'bozza',
        description_md: build.description_md,
        playstyle_md: build.playstyle_md,
        forma: build.forma,
        polarity: build.polarity,
        reattore: build.reattore,
        aura: build.aura,
        exilus: build.exilus,
        arcane: build.arcane,
        focus_school: build.focus_school,
        stats: build.stats,
      })
      .select()
      .single();

    if (error || !newBuild) {
      setLoading(false);
      return;
    }

    if (mods.length) {
      await supabase.from('build_mods').insert(
        mods.map((m) => ({
          build_id: newBuild.id,
          mod_name: m.mod_name,
          rank: m.rank,
          slot: m.slot,
          note: m.note,
          ordine: m.ordine,
        }))
      );
    }

    router.push(`/build/${newBuild.id}/edit`);
  }

  return (
    <button onClick={handleDuplicate} disabled={loading} className="btn-secondary">
      {loading ? 'Duplicazione…' : 'Duplica'}
    </button>
  );
}
