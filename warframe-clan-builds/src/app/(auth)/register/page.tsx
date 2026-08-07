'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
        <div className="card p-6 max-w-sm text-center">
          <h1 className="text-lg font-semibold text-slate-100 mb-2">Richiesta inviata</h1>
          <p className="text-sm text-slate-400">
            Il tuo account è in attesa di approvazione da parte dell&apos;Admin del clan.
            Riceverai accesso non appena verrà approvato.
          </p>
          <Link href="/login" className="btn-secondary inline-block mt-4">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-100">Richiedi accesso al clan</h1>
          <p className="text-sm text-slate-400 mt-1">
            L&apos;account dovrà essere approvato dall&apos;Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nome utente</label>
            <input
              required
              className="input-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="es. Tenno_Rossi"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Invio…' : 'Richiedi accesso'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Hai già un account?{' '}
          <Link href="/login" className="text-accent-400 hover:text-accent-300">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
