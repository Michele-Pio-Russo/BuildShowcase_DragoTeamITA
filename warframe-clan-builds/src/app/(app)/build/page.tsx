import BuildExplorer from '@/components/build/BuildExplorer';

export default function BuildListPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Tutte le build</h1>
      <p className="text-slate-400 text-sm mb-6">
        Cerca, filtra e ordina l&apos;archivio del clan.
      </p>
      <BuildExplorer />
    </div>
  );
}
