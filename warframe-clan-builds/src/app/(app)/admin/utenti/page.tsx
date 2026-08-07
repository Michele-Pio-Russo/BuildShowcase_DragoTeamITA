import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminUsersClient from '@/components/admin/AdminUsersClient';

export default async function AdminUtentiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Gestione utenti</h1>
      <p className="text-slate-400 text-sm mb-6">
        Approva le richieste di accesso e assegna i ruoli del clan.
      </p>
      <AdminUsersClient />
    </div>
  );
}
