'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { Profile } from '@/lib/types';

export default function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const canEdit = profile.role === 'editor' || profile.role === 'admin';

  const item = (href: string, icon: string, label: string) => (
    <Link
      href={href}
      className={clsx(
        'flex flex-col items-center gap-0.5 text-xs flex-1 py-2',
        pathname === href ? 'text-accent-300' : 'text-slate-500'
      )}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-base-900 border-t border-base-700 flex items-center z-40">
      {item('/dashboard', '▣', 'Home')}
      {item('/build', '▤', 'Build')}
      {canEdit && item('/build/nuova', '+', 'Nuova')}
      {item('/preferiti', '★', 'Preferiti')}
    </nav>
  );
}
