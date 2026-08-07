import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoadoutForm from '@/components/loadout/LoadoutForm';
import AccessDenied from '@/components/ui/AccessDenied';
import type { Loadout } from '@/lib/types';

export default async function ModificaLoadoutPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return <AccessDenied />;
  }

  const { data: loadout } = await supabase
    .from('loadouts')
    .select(
      `*,
       warframe_build:builds!loadouts_warframe_build_id_fkey(*),
       companion_build:builds!loadouts_companion_build_id_fkey(*),
       companion_weapon_build:builds!loadouts_companion_weapon_build_id_fkey(*)`
    )
    .eq('id', params.id)
    .single<Loadout>();

  if (!loadout) notFound();

  return <LoadoutForm existingLoadout={loadout} />;
}
