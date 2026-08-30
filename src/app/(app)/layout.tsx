import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Profile } from '@/lib/types';

// Disattiva la cache dei dati di Next.js per tutte le pagine di questa
// sezione: senza questo, subito dopo aver creato una build/loadout può
// capitare che la pagina di dettaglio mostri "non trovato" perché legge
// una risposta cache precedente alla creazione, invece di interrogare
// di nuovo Supabase.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Nota: il middleware (src/middleware.ts) blocca già l'accesso a queste
// pagine per chi non è autenticato, quindi qui NON usiamo redirect() di
// next/navigation: in dev, con Fast Refresh, un redirect() lato Server
// Component può entrare in un ping-pong con il middleware e mandare in
// loop il client. Se per qualche motivo user/profilo non risultano
// disponibili qui, mostriamo un fallback sicuro invece di rilanciare.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SessionFallback message="Sessione non trovata. Torna al login." />;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) {
    return (
      <SessionFallback
        message={`Profilo non trovato. ID utente: ${user.id}. Errore: ${
          profileError?.message ?? 'nessun dettaglio'
        } (codice: ${profileError?.code ?? '—'})`}
      />
    );
  }

  if (profile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
        <div className="card p-6 max-w-sm text-center">
          <h1 className="text-lg font-semibold text-slate-100 mb-2">Account in attesa</h1>
          <p className="text-sm text-slate-400">
            Il tuo accesso è in attesa di approvazione da parte dell&apos;Admin del clan.
          </p>
        </div>
      </div>
    );
  }

  if (profile.status === 'rifiutato') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
        <div className="card p-6 max-w-sm text-center">
          <h1 className="text-lg font-semibold text-slate-100 mb-2">Accesso non concesso</h1>
          <p className="text-sm text-slate-400">
            Contatta l&apos;Admin del clan per maggiori informazioni.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-950 flex">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 md:pb-0">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <MobileNav profile={profile} />
    </div>
  );
}

function SessionFallback({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
      <div className="card p-6 max-w-sm text-center">
        <h1 className="text-lg font-semibold text-slate-100 mb-2">Accesso richiesto</h1>
        <p className="text-sm text-slate-400 mb-4">{message}</p>
        <a href="/login" className="btn-primary inline-block">
          Vai al login
        </a>
      </div>
    </div>
  );
}
