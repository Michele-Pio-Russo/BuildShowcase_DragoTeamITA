import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import type { Profile } from '@/lib/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) redirect('/login');

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
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav profile={profile} />
    </div>
  );
}
