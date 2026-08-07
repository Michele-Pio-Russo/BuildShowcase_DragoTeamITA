'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole, UserStatus } from '@/lib/types';

export default function AdminUsersClient() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: UserStatus) {
    await supabase.from('profiles').update({ status }).eq('id', id);
    load();
  }

  async function updateRole(id: string, role: UserRole) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    load();
  }

  async function removeUser(id: string) {
    if (!confirm('Rimuovere questo utente? Perderà l\'accesso all\'archivio.')) return;
    await supabase.from('profiles').update({ status: 'rifiutato' }).eq('id', id);
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Caricamento…</p>;

  const pending = profiles.filter((p) => p.status === 'pending');
  const others = profiles.filter((p) => p.status !== 'pending');

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-slate-100 mb-3">
            In attesa di approvazione ({pending.length})
          </h2>
          <div className="card divide-y divide-base-700">
            {pending.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-200">{p.username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(p.id, 'approvato')}
                    className="btn-primary !px-3 !py-1.5 text-xs"
                  >
                    Approva
                  </button>
                  <button
                    onClick={() => updateStatus(p.id, 'rifiutato')}
                    className="btn-secondary !px-3 !py-1.5 text-xs"
                  >
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium text-slate-100 mb-3">Membri del clan</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-base-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Utente</th>
                <th className="text-left px-4 py-2 font-medium">Ruolo</th>
                <th className="text-left px-4 py-2 font-medium">Stato</th>
                <th className="text-left px-4 py-2 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700">
              {others.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-slate-100">{p.username}</td>
                  <td className="px-4 py-2">
                    <select
                      className="input-base !py-1 !text-xs"
                      value={p.role}
                      onChange={(e) => updateRole(p.id, e.target.value as UserRole)}
                      disabled={p.role === 'admin'}
                    >
                      <option value="membro">Membro</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-slate-400 capitalize">{p.status}</td>
                  <td className="px-4 py-2">
                    {p.role !== 'admin' && (
                      <button
                        onClick={() => removeUser(p.id)}
                        className="text-xs text-slate-500 hover:text-red-400"
                      >
                        Rimuovi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
