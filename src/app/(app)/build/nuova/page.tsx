import { createClient } from '@/lib/supabase/server';
import BuildForm from '@/components/build/BuildForm';
import AccessDenied from '@/components/ui/AccessDenied';

export default async function NuovaBuildPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return <AccessDenied />;
  }

  return <BuildForm />;
}
