// Il middleware (src/middleware.ts) gestisce già il redirect di "/" verso
// /dashboard o /login prima che questa pagina venga renderizzata.
// Questo fallback non dovrebbe quasi mai essere visibile.
export default function Home() {
  return null;
}
