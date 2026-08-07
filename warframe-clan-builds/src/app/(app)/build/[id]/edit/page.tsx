import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BuildForm from '@/components/build/BuildForm';
import type { Build } from '@/lib/types';

export default async function ModificaBuildPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    redirect('/build');
  }

  const { data: build } = await supabase
    .from('builds')
    .select('*')
    .eq('id', params.id)
    .single<Build>();

  if (!build) notFound();

  return <BuildForm existingBuild={build} />;
}
