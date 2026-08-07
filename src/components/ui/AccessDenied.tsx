import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-slate-100 mb-2">Accesso non consentito</h1>
      <p className="text-sm text-slate-400 mb-4">
        Non hai i permessi necessari per visualizzare questa pagina.
      </p>
      <Link href="/dashboard" className="btn-secondary inline-block">
        Torna alla dashboard
      </Link>
    </div>
  );
}
