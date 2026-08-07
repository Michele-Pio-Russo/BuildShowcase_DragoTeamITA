import { createClient } from '@/lib/supabase/server';
import AdminUsersClient from '@/components/admin/AdminUsersClient';
import AccessDenied from '@/components/ui/AccessDenied';

// Niente redirect() qui: il middleware già garantisce l'autenticazione.
// Per il controllo del ruolo mostriamo un fallback invece di reindirizzare,
// per evitare il bug di Next.js in dev con redirect() nei Server Component.
export default async function AdminUtentiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return <AccessDenied />;

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
