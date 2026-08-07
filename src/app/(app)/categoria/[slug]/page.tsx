import { notFound } from 'next/navigation';
import BuildExplorer from '@/components/build/BuildExplorer';
import { CATEGORY_LABELS } from '@/lib/types';

export default function CategoriaPage({ params }: { params: { slug: string } }) {
  const label = CATEGORY_LABELS[params.slug];
  if (!label) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">{label}</h1>
      <p className="text-slate-400 text-sm mb-6">
        Build della categoria &quot;{label}&quot;.
      </p>
      <BuildExplorer fixedCategorySlug={params.slug} />
    </div>
  );
}
