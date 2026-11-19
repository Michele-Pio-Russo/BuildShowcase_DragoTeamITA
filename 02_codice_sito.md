# Codice sorgente del progetto

Generato il 2026-11-18 con genera-contesto.mjs — 54 file.
Ogni file è introdotto da un titolo "## `percorso`" seguito da un blocco di codice: si può ricostruire la cartella del progetto spezzando il testo su quei titoli.

---

## `package.json`

```json
{
  "name": "warframe-clan-builds",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.4",
    "next": "14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5"
  }
}
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0b0f',
          900: '#0e1016',
          800: '#151824',
          700: '#1c2032',
          600: '#262b40',
        },
        accent: {
          500: '#6f5bff',
          400: '#8a78ff',
          300: '#b3a6ff',
        },
        gold: {
          500: '#c9a44c',
          400: '#dcbd6f',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
```

---

## `supabase/migrations/0001_init.sql`

```sql
-- =========================================================
-- Warframe Clan Builds — schema iniziale + RLS
-- =========================================================

-- ---------- ENUM ----------
create type user_role as enum ('admin', 'editor', 'membro');
create type user_status as enum ('pending', 'approvato', 'rifiutato');
create type build_status as enum ('bozza', 'pubblicata');

-- ---------- PROFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role user_role not null default 'membro',
  status user_status not null default 'pending',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- CATEGORIES (seed fisso) ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  ordine int not null default 0
);

insert into categories (slug, label, ordine) values
  ('warframe', 'Warframe', 1),
  ('arma_primaria', 'Armi primarie', 2),
  ('arma_secondaria', 'Armi secondarie', 3),
  ('arma_melee', 'Armi melee', 4),
  ('companion', 'Companion', 5),
  ('arma_companion', 'Armi dei companion', 6);

-- ---------- TAGS ----------
create table tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

-- ---------- BUILDS ----------
create table builds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid not null references categories(id),
  item_name text not null,
  image_url text,
  author_id uuid not null references profiles(id),
  status build_status not null default 'bozza',
  description_md text default '',
  playstyle_md text default '',
  forma text,          -- es. "3x V, 1x -"
  polarity text,
  reattore boolean default false,
  aura text,
  exilus text,
  arcane text,
  focus_school text,
  stats jsonb not null default '{}'::jsonb,   -- {"critica": "alta", "status": "media", ...}
  views_count int not null default 0,
  saves_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index builds_category_idx on builds(category_id);
create index builds_status_idx on builds(status);
create index builds_author_idx on builds(author_id);
create index builds_updated_idx on builds(updated_at desc);

-- ---------- BUILD MODS ----------
create table build_mods (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  mod_name text not null,
  rank int,
  slot text,
  note text,
  ordine int not null default 0
);

create index build_mods_build_idx on build_mods(build_id);

-- ---------- BUILD TAGS (n:n) ----------
create table build_tags (
  build_id uuid not null references builds(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (build_id, tag_id)
);

-- ---------- FAVORITES ----------
create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  build_id uuid not null references builds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, build_id)
);

-- ---------- COMMENTS ----------
create table comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  author_id uuid not null references profiles(id),
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index comments_build_idx on comments(build_id);

-- ---------- BUILD HISTORY ----------
create table build_history (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  editor_id uuid not null references profiles(id),
  changed_at timestamptz not null default now(),
  diff_summary text
);

create index build_history_build_idx on build_history(build_id);

-- =========================================================
-- FUNZIONI DI SUPPORTO (SECURITY DEFINER per evitare ricorsione RLS)
-- =========================================================

create or replace function current_role_is(target_role user_role)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_editor_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

create or replace function is_approved()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'approvato'
  );
$$;

-- trigger: aggiorna updated_at e registra storico ad ogni update di builds
create or replace function handle_build_update()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  insert into build_history (build_id, editor_id, diff_summary)
  values (new.id, auth.uid(), 'Build aggiornata');
  return new;
end;
$$;

create trigger trg_build_update
  before update on builds
  for each row
  execute function handle_build_update();

-- trigger: crea automaticamente il profilo alla registrazione (stato pending)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'membro',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table builds enable row level security;
alter table build_mods enable row level security;
alter table build_tags enable row level security;
alter table favorites enable row level security;
alter table comments enable row level security;
alter table build_history enable row level security;

-- ---- PROFILES ----
create policy "profiles_select_own_or_approved" on profiles
  for select using (
    id = auth.uid() or is_admin() or status = 'approvato'
  );

create policy "profiles_update_own_basic_fields" on profiles
  for update using (id = auth.uid() or is_admin());

create policy "profiles_admin_manage" on profiles
  for all using (is_admin()) with check (is_admin());

-- ---- CATEGORIES / TAGS: lettura pubblica per approvati, scrittura editor/admin ----
create policy "categories_select" on categories
  for select using (is_approved() or is_admin());

create policy "tags_select" on tags
  for select using (is_approved() or is_admin());

create policy "tags_write" on tags
  for insert with check (is_editor_or_admin());

-- ---- BUILDS ----
create policy "builds_select_published_or_own" on builds
  for select using (
    is_approved() and (
      status = 'pubblicata'
      or author_id = auth.uid()
      or is_editor_or_admin()
    )
  );

create policy "builds_insert_editor_admin" on builds
  for insert with check (is_editor_or_admin() and is_approved());

create policy "builds_update_editor_admin" on builds
  for update using (is_editor_or_admin() and is_approved());

create policy "builds_delete_admin_or_author" on builds
  for delete using (is_admin() or (is_editor_or_admin() and author_id = auth.uid()));

-- ---- BUILD MODS ----
create policy "build_mods_select" on build_mods
  for select using (
    exists (
      select 1 from builds b
      where b.id = build_mods.build_id
        and (b.status = 'pubblicata' or b.author_id = auth.uid() or is_editor_or_admin())
    ) and is_approved()
  );

create policy "build_mods_write" on build_mods
  for all using (is_editor_or_admin() and is_approved())
  with check (is_editor_or_admin() and is_approved());

-- ---- BUILD TAGS ----
create policy "build_tags_select" on build_tags
  for select using (is_approved());

create policy "build_tags_write" on build_tags
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

-- ---- FAVORITES ----
create policy "favorites_owner" on favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- COMMENTS ----
create policy "comments_select" on comments
  for select using (is_approved());

create policy "comments_insert_own" on comments
  for insert with check (author_id = auth.uid() and is_approved());

create policy "comments_update_delete_own_or_admin" on comments
  for update using (author_id = auth.uid() or is_admin());

create policy "comments_delete_own_or_admin" on comments
  for delete using (author_id = auth.uid() or is_admin());

-- ---- BUILD HISTORY ----
create policy "build_history_select" on build_history
  for select using (is_approved());

-- Nota: l'insert su build_history avviene solo tramite trigger (SECURITY DEFINER),
-- quindi non serve una policy insert per gli utenti.
```

---

## `supabase/migrations/0002_stile_e_galleria_mod.sql`

```sql
-- =========================================================
-- Stile (stance) per armi melee + galleria multi-immagine mod
-- =========================================================

-- ---------- STILE (solo armi melee) ----------
alter table builds add column if not exists stile text;

-- ---------- GALLERIA IMMAGINI CONFIGURAZIONE MOD ----------
-- Sostituisce il singolo "mods_image_url": più screenshot, ognuno con la sua didascalia.
create table build_mod_images (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  image_url text not null,
  caption text,
  ordine int not null default 0,
  created_at timestamptz not null default now()
);

create index build_mod_images_build_idx on build_mod_images(build_id);

alter table build_mod_images enable row level security;

-- Stesse regole di visibilità/scrittura di build_mods
create policy "build_mod_images_select" on build_mod_images
  for select using (
    exists (
      select 1 from builds b
      where b.id = build_mod_images.build_id
        and (b.status = 'pubblicata' or b.author_id = auth.uid() or is_editor_or_admin())
    ) and is_approved()
  );

create policy "build_mod_images_write" on build_mod_images
  for all using (is_editor_or_admin() and is_approved())
  with check (is_editor_or_admin() and is_approved());
```

---

## `supabase/migrations/0002_storage.sql`

```sql
-- Bucket per le immagini delle build
insert into storage.buckets (id, name, public)
values ('build-images', 'build-images', true)
on conflict (id) do nothing;

-- Lettura pubblica delle immagini (bucket pubblico, ok per un clan privato con URL non indicizzati)
create policy "build_images_public_read"
  on storage.objects for select
  using (bucket_id = 'build-images');

-- Solo editor/admin approvati possono caricare
create policy "build_images_editor_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'build-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor','admin') and status = 'approvato'
    )
  );

create policy "build_images_editor_update_delete"
  on storage.objects for update
  using (
    bucket_id = 'build-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor','admin') and status = 'approvato'
    )
  );

create policy "build_images_editor_delete"
  on storage.objects for delete
  using (
    bucket_id = 'build-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor','admin') and status = 'approvato'
    )
  );
```

---

## `supabase/migrations/0003_preferiti_commenti_loadout.sql`

```sql
-- =========================================================
-- Preferiti e commenti anche per i loadout
-- =========================================================

alter table loadouts add column if not exists saves_count int not null default 0;

-- ---------- FAVORITES: build O loadout ----------
alter table favorites drop constraint favorites_pkey;
alter table favorites add column id uuid primary key default gen_random_uuid();
alter table favorites alter column build_id drop not null;
alter table favorites add column loadout_id uuid references loadouts(id) on delete cascade;

alter table favorites add constraint favorites_target_check check (
  (build_id is not null and loadout_id is null) or (build_id is null and loadout_id is not null)
);

create unique index favorites_user_build_uniq on favorites(user_id, build_id) where build_id is not null;
create unique index favorites_user_loadout_uniq on favorites(user_id, loadout_id) where loadout_id is not null;

-- ---------- COMMENTS: build O loadout ----------
alter table comments alter column build_id drop not null;
alter table comments add column loadout_id uuid references loadouts(id) on delete cascade;

alter table comments add constraint comments_target_check check (
  (build_id is not null and loadout_id is null) or (build_id is null and loadout_id is not null)
);

create index comments_loadout_idx on comments(loadout_id);

-- Le policy RLS esistenti (favorites_owner, comments_select/insert/update/delete)
-- sono già generiche (basate su user_id/author_id, non sul target), quindi
-- funzionano automaticamente anche per i loadout senza bisogno di nuove policy.
```

---

## `src/app/(app)/admin/utenti/page.tsx`

```tsx
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
```

---

## `src/app/(app)/build/[id]/edit/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BuildForm from '@/components/build/BuildForm';
import AccessDenied from '@/components/ui/AccessDenied';
import type { Build } from '@/lib/types';

export default async function ModificaBuildPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return <AccessDenied />;
  }

  const { data: build } = await supabase
    .from('builds')
    .select('*')
    .eq('id', params.id)
    .single<Build>();

  if (!build) notFound();

  return <BuildForm existingBuild={build} />;
}
```

---

## `src/app/(app)/build/[id]/page.tsx`

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Build, BuildMod, BuildModImage, Profile, BuildHistoryEntry, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import FavoriteButton from '@/components/build/FavoriteButton';
import DuplicateButton from '@/components/build/DuplicateButton';
import DeleteBuildButton from '@/components/build/DeleteBuildButton';
import CommentSection from '@/components/comments/CommentSection';
import { preserveLineBreaks } from '@/lib/markdown';
import MarkdownText from '@/components/ui/MarkdownText';
import RailjackSection from '@/components/build/RailjackSection';

export default async function BuildDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: build } = await supabase
    .from('builds')
    .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*)')
    .eq('id', params.id)
    .single<Build>();

  if (!build) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single<Profile>();

  const canEdit = profile?.role === 'editor' || profile?.role === 'admin';
  const canDelete = profile?.role === 'admin' || (profile?.role === 'editor' && build.author_id === user?.id);

  const [{ data: mods }, { data: modImages }, { data: buildTags }, { data: history }, { data: favorite }] =
    await Promise.all([
      supabase.from('build_mods').select('*').eq('build_id', build.id).order('ordine'),
      supabase.from('build_mod_images').select('*').eq('build_id', build.id).order('ordine'),
      supabase.from('build_tags').select('tag:tags(*)').eq('build_id', build.id),
      supabase
        .from('build_history')
        .select('*, editor:profiles!build_history_editor_id_fkey(*)')
        .eq('build_id', build.id)
        .order('changed_at', { ascending: false })
        .limit(10),
      user
        ? supabase
            .from('favorites')
            .select('build_id')
            .eq('user_id', user.id)
            .eq('build_id', build.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  // conteggio visualizzazioni (fire and forget)
  supabase.rpc('increment_views', { p_build_id: build.id }).then();

  const tags = (buildTags?.map((t: any) => t.tag).filter(Boolean) ?? []) as Tag[];

  const statLabels: Record<string, string> = {
    critica: 'Critica',
    status: 'Status',
    danno: 'Danno',
    sopravvivenza: 'Sopravvivenza',
    energia: 'Energia',
    range: 'Range',
    durata: 'Durata',
    forza: 'Forza',
    efficienza: 'Efficienza',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-4">
        <Link
          href={build.category?.slug ? `/categoria/${build.category.slug}` : '/build'}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Torna a {CATEGORY_LABELS[build.category?.slug ?? ''] ?? 'tutte le build'}
        </Link>
      </div>

      {build.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={build.image_url}
          alt={build.title}
          className="block mx-auto max-w-full max-h-96 w-auto h-auto rounded-xl border border-base-600 mb-5"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-sm text-gold-400">
            {CATEGORY_LABELS[build.category?.slug ?? ''] ?? build.category?.label}
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mt-1">{build.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{build.item_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            targetType="build"
            targetId={build.id}
            initialFavorite={!!favorite}
            savesCount={build.saves_count}
          />
          {canEdit && (
            <>
              <Link href={`/build/${build.id}/edit`} className="btn-secondary">
                Modifica
              </Link>
              <DuplicateButton build={build} mods={(mods as BuildMod[]) ?? []} />
            </>
          )}
          {canDelete && <DeleteBuildButton buildId={build.id} buildTitle={build.title} />}
        </div>
      </div>

      {/* Proprietà */}
      <div className="card p-4 my-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <Prop label="Autore" value={build.author?.username ?? '—'} />
        <Prop label="Stato" value={build.status === 'pubblicata' ? 'Pubblicata' : 'Bozza'} />
        <Prop label="Creata" value={new Date(build.created_at).toLocaleDateString('it-IT')} />
        <Prop label="Aggiornata" value={new Date(build.updated_at).toLocaleDateString('it-IT')} />
        {build.forma && <Prop label="Forma" value={build.forma} />}
        {build.stile && <Prop label="Stile" value={build.stile} />}
        {build.reattore && <Prop label="Reattore/Catalizzatore" value="Sì" />}
        {build.aura && <Prop label="Aura" value={build.aura} />}
        {build.exilus && <Prop label="Exilus" value={build.exilus} />}
        {build.arcane && <Prop label="Arcane" value={build.arcane} />}
        {build.focus_school && <Prop label="Focus School" value={build.focus_school} />}
        {build.archon_shards && <Prop label="Archon Shards" value={build.archon_shards} />}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map((t) => (
            <span key={t.id} className="badge badge-gold">
              {t.nome}
            </span>
          ))}
        </div>
      )}

      {build.description_md && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Descrizione</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <MarkdownText text={build.description_md} />
          </div>
        </section>
      )}

      {build.playstyle_md && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Stile di gioco e casi d&apos;uso</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <MarkdownText text={build.playstyle_md} />
          </div>
        </section>
      )}

      <RailjackSection data={build.railjack} />

      {modImages && modImages.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Configurazione mod</h2>
          <div className="space-y-4">
            {(modImages as BuildModImage[]).map((mi) => (
              <div key={mi.id} className="w-fit max-w-full mx-auto">
                {mi.caption && <p className="text-sm text-slate-400 mb-1.5">{mi.caption}</p>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mi.image_url}
                  alt={mi.caption ?? 'Configurazione mod'}
                  className="block max-w-full max-h-[32rem] w-auto h-auto rounded-xl border border-base-600"
                />
              </div>
            ))}
          </div>
        </section>
      ) : build.mods_image_url ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Configurazione mod</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={build.mods_image_url}
            alt="Configurazione mod"
            className="block mx-auto max-w-full max-h-[32rem] w-auto h-auto rounded-xl border border-base-600"
          />
        </section>
      ) : (
        mods && mods.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Mod</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 bg-base-700/40">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Mod</th>
                  <th className="text-left px-4 py-2 font-medium">Slot</th>
                  <th className="text-left px-4 py-2 font-medium">Rank</th>
                  <th className="text-left px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-700">
                {(mods as BuildMod[]).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-slate-100">{m.mod_name}</td>
                    <td className="px-4 py-2 text-slate-400">{m.slot ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-400">{m.rank ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-400">{m.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )
      )}

      {build.stats && Object.keys(build.stats).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Statistiche e priorità</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(build.stats).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="card px-3 py-2">
                    <p className="text-xs text-slate-500">{statLabels[key] ?? key}</p>
                    <p className="text-sm text-slate-100">{value}</p>
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {canEdit && history && history.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Storico modifiche</h2>
          <div className="card divide-y divide-base-700">
            {(history as BuildHistoryEntry[]).map((h) => (
              <div key={h.id} className="px-4 py-2 text-sm flex justify-between">
                <span className="text-slate-300">{h.editor?.username}</span>
                <span className="text-slate-500">
                  {new Date(h.changed_at).toLocaleString('it-IT')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <CommentSection buildId={build.id} />
    </div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
```

---

## `src/app/(app)/build/nuova/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server';
import BuildForm from '@/components/build/BuildForm';
import AccessDenied from '@/components/ui/AccessDenied';

export default async function NuovaBuildPage({
  searchParams,
}: {
  searchParams: { r?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return <AccessDenied />;
  }

  return <BuildForm key={searchParams.r ?? 'default'} />;
}
```

---

## `src/app/(app)/build/page.tsx`

```tsx
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
```

---

## `src/app/(app)/categoria/[slug]/page.tsx`

```tsx
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
```

---

## `src/app/(app)/dashboard/page.tsx`

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BuildCard from '@/components/build/BuildCard';
import type { Build } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ count: totalBuilds }, { data: recentBuilds }, { data: popularBuilds }, { data: recentComments }] =
    await Promise.all([
      supabase.from('builds').select('*', { count: 'exact', head: true }).eq('status', 'pubblicata'),
      supabase
        .from('builds')
        .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*)')
        .eq('status', 'pubblicata')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('builds')
        .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*)')
        .eq('status', 'pubblicata')
        .order('saves_count', { ascending: false })
        .limit(4),
      supabase
        .from('comments')
        .select('*, author:profiles!comments_author_id_fkey(*), build:builds(id, title)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">Panoramica dell&apos;archivio build del clan</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Build pubblicate" value={totalBuilds ?? 0} />
        <StatCard label="Recenti (7gg)" value={recentBuilds?.length ?? 0} />
        <QuickLink href="/build" label="Cerca build" icon="⌕" />
        <QuickLink href="/preferiti" label="Preferiti" icon="★" />
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-100">Build recenti</h2>
          <Link href="/build?ordine=recenti" className="text-sm text-accent-400 hover:text-accent-300">
            Vedi tutte
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(recentBuilds as Build[] | null)?.map((b) => <BuildCard key={b.id} build={b} />)}
          {!recentBuilds?.length && <EmptyHint />}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-100">Build più popolari</h2>
          <Link href="/build?ordine=popolari" className="text-sm text-accent-400 hover:text-accent-300">
            Vedi tutte
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(popularBuilds as Build[] | null)?.map((b) => <BuildCard key={b.id} build={b} />)}
          {!popularBuilds?.length && <EmptyHint />}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-100 mb-3">Attività recente</h2>
        <div className="card divide-y divide-base-700">
          {recentComments?.length ? (
            recentComments.map((c: any) => (
              <div key={c.id} className="px-4 py-3 text-sm">
                <span className="text-slate-200 font-medium">{c.author?.username}</span>{' '}
                <span className="text-slate-400">ha commentato</span>{' '}
                <Link href={`/build/${c.build?.id}`} className="text-accent-400 hover:text-accent-300">
                  {c.build?.title}
                </Link>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">
              Nessuna attività recente.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-4">
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="card px-4 py-4 flex flex-col justify-center hover:border-accent-500/40 transition-colors">
      <span className="text-lg text-gold-400">{icon}</span>
      <p className="text-xs text-slate-300 mt-1">{label}</p>
    </Link>
  );
}

function EmptyHint() {
  return (
    <div className="col-span-full text-sm text-slate-500 text-center py-8 border border-dashed border-base-600 rounded-xl">
      Nessuna build ancora pubblicata.
    </div>
  );
}
```

---

## `src/app/(app)/layout.tsx`

```tsx
import { Suspense } from 'react';
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
          <Suspense fallback={null}>
            <Breadcrumbs />
          </Suspense>
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
```

---

## `src/app/(app)/loadout/[id]/edit/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoadoutForm from '@/components/loadout/LoadoutForm';
import AccessDenied from '@/components/ui/AccessDenied';
import type { Loadout } from '@/lib/types';

export default async function ModificaLoadoutPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return <AccessDenied />;
  }

  const { data: loadout } = await supabase
    .from('loadouts')
    .select(
      `*,
       warframe_build:builds!loadouts_warframe_build_id_fkey(*),
       companion_build:builds!loadouts_companion_build_id_fkey(*),
       companion_weapon_build:builds!loadouts_companion_weapon_build_id_fkey(*)`
    )
    .eq('id', params.id)
    .single<Loadout>();

  if (!loadout) notFound();

  return <LoadoutForm existingLoadout={loadout} />;
}
```

---

## `src/app/(app)/loadout/[id]/page.tsx`

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Loadout, LoadoutWeapon, Profile, WeaponSlot } from '@/lib/types';
import { preserveLineBreaks } from '@/lib/markdown';
import MarkdownText from '@/components/ui/MarkdownText';
import FavoriteButton from '@/components/build/FavoriteButton';
import CommentSection from '@/components/comments/CommentSection';
import DeleteLoadoutButton from '@/components/loadout/DeleteLoadoutButton';

const slotLabels: Record<WeaponSlot, string> = {
  primaria: 'Arma primaria',
  secondaria: 'Arma secondaria',
  melee: 'Arma melee',
  exalted: 'Arma Exalted',
};

export default async function LoadoutDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: loadout } = await supabase
    .from('loadouts')
    .select(
      `*, author:profiles!loadouts_author_id_fkey(*),
       warframe_build:builds!loadouts_warframe_build_id_fkey(*, category:categories(*)),
       companion_build:builds!loadouts_companion_build_id_fkey(*, category:categories(*)),
       companion_weapon_build:builds!loadouts_companion_weapon_build_id_fkey(*, category:categories(*))`
    )
    .eq('id', params.id)
    .single<Loadout>();

  if (!loadout) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single<Profile>();

  const canEdit = profile?.role === 'editor' || profile?.role === 'admin';
  const canDelete =
    profile?.role === 'admin' || (profile?.role === 'editor' && loadout.author_id === user?.id);

  const { data: favorite } = user
    ? await supabase
        .from('favorites')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('loadout_id', loadout.id)
        .maybeSingle()
    : { data: null };

  const { data: weaponsData } = await supabase
    .from('loadout_weapons')
    .select('*, build:builds(*, category:categories(*))')
    .eq('loadout_id', loadout.id)
    .order('ordine');

  const weapons = (weaponsData as LoadoutWeapon[]) ?? [];
  const bySlot = (slot: WeaponSlot) => weapons.filter((w) => w.slot === slot);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-4">
        <Link href="/loadout" className="text-sm text-slate-400 hover:text-slate-200">
          ← Torna ai loadout
        </Link>
      </div>

      {loadout.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={loadout.image_url}
          alt={loadout.title}
          className="block mx-auto max-w-full max-h-96 w-auto h-auto rounded-xl border border-base-600 mb-5"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <span className="text-sm text-gold-400">Loadout completo</span>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mt-1">{loadout.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{loadout.author?.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            targetType="loadout"
            targetId={loadout.id}
            initialFavorite={!!favorite}
            savesCount={loadout.saves_count}
          />
          {canEdit && (
            <Link href={`/loadout/${loadout.id}/edit`} className="btn-secondary">
              Modifica
            </Link>
          )}
          {canDelete && <DeleteLoadoutButton loadoutId={loadout.id} loadoutTitle={loadout.title} />}
        </div>
      </div>

      {/* Warframe */}
      <section className="mb-6">
        <h2 className="text-lg font-medium text-slate-100 mb-2">Warframe</h2>
        {loadout.warframe_build ? (
          <Link
            href={`/build/${loadout.warframe_build.id}?fromLoadout=${loadout.id}`}
            className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
          >
            <div>
              <p className="text-sm text-slate-100">{loadout.warframe_build.title}</p>
              <p className="text-xs text-slate-500">{loadout.warframe_build.item_name}</p>
            </div>
            <span className="text-xs text-accent-400">Vedi build →</span>
          </Link>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-slate-100">{loadout.warframe_item_name ?? '—'}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
          {loadout.warframe_forma && <Prop label="Forma" value={loadout.warframe_forma} />}
          {loadout.warframe_polarity && <Prop label="Polarità" value={loadout.warframe_polarity} />}
          {loadout.warframe_aura && <Prop label="Aura" value={loadout.warframe_aura} />}
          {loadout.warframe_exilus && <Prop label="Exilus" value={loadout.warframe_exilus} />}
          {loadout.warframe_arcane && <Prop label="Arcane" value={loadout.warframe_arcane} />}
          {loadout.warframe_focus_school && (
            <Prop label="Focus School" value={loadout.warframe_focus_school} />
          )}
          {loadout.warframe_archon_shards && (
            <Prop label="Archon Shards" value={loadout.warframe_archon_shards} />
          )}
        </div>
      </section>

      {/* Armi */}
      {(['primaria', 'secondaria', 'melee', 'exalted'] as WeaponSlot[]).map(
        (slot) =>
          bySlot(slot).length > 0 && (
            <section key={slot} className="mb-6">
              <h2 className="text-lg font-medium text-slate-100 mb-2">{slotLabels[slot]}</h2>
              <div className="space-y-2">
                {bySlot(slot).map((w) =>
                  w.build ? (
                    <Link
                      key={w.id}
                      href={`/build/${w.build.id}?fromLoadout=${loadout.id}`}
                      className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
                    >
                      <div>
                        <p className="text-sm text-slate-100">{w.build.title}</p>
                        <p className="text-xs text-slate-500">{w.build.item_name}</p>
                      </div>
                      <span className="text-xs text-accent-400">Vedi build →</span>
                    </Link>
                  ) : (
                    <div key={w.id} className="card p-4">
                      <p className="text-sm text-slate-100">{w.item_name}</p>
                    </div>
                  )
                )}
              </div>
            </section>
          )
      )}

      {/* Companion */}
      {(loadout.companion_build || loadout.companion_item_name) && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Companion</h2>
          {loadout.companion_build ? (
            <Link
              href={`/build/${loadout.companion_build.id}?fromLoadout=${loadout.id}`}
              className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
            >
              <div>
                <p className="text-sm text-slate-100">{loadout.companion_build.title}</p>
                <p className="text-xs text-slate-500">{loadout.companion_build.item_name}</p>
              </div>
              <span className="text-xs text-accent-400">Vedi build →</span>
            </Link>
          ) : (
            <div className="card p-4">
              <p className="text-sm text-slate-100">{loadout.companion_item_name}</p>
            </div>
          )}

          {(loadout.companion_weapon_build || loadout.companion_weapon_item_name) && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Arma del companion</p>
              {loadout.companion_weapon_build ? (
                <Link
                  href={`/build/${loadout.companion_weapon_build.id}?fromLoadout=${loadout.id}`}
                  className="card px-4 py-3 flex items-center justify-between hover:border-accent-500/40 transition-colors"
                >
                  <div>
                    <p className="text-sm text-slate-100">{loadout.companion_weapon_build.title}</p>
                    <p className="text-xs text-slate-500">{loadout.companion_weapon_build.item_name}</p>
                  </div>
                  <span className="text-xs text-accent-400">Vedi build →</span>
                </Link>
              ) : (
                <div className="card p-4">
                  <p className="text-sm text-slate-100">{loadout.companion_weapon_item_name}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {loadout.notes_md && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-slate-100 mb-2">Note e strategia</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <MarkdownText text={loadout.notes_md} />
          </div>
        </section>
      )}

      <CommentSection loadoutId={loadout.id} />
    </div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
```

---

## `src/app/(app)/loadout/nuovo/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server';
import LoadoutForm from '@/components/loadout/LoadoutForm';
import AccessDenied from '@/components/ui/AccessDenied';

export default async function NuovoLoadoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return <AccessDenied />;
  }

  return <LoadoutForm />;
}
```

---

## `src/app/(app)/loadout/page.tsx`

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LoadoutCard from '@/components/loadout/LoadoutCard';
import type { Loadout } from '@/lib/types';

export default async function LoadoutListPage() {
  const supabase = createClient();

  const { data: loadouts } = await supabase
    .from('loadouts')
    .select(
      '*, author:profiles!loadouts_author_id_fkey(*), warframe_build:builds!loadouts_warframe_build_id_fkey(*), companion_build:builds!loadouts_companion_build_id_fkey(*)'
    )
    .eq('status', 'pubblicata')
    .order('updated_at', { ascending: false })
    .limit(60);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-slate-100">Loadout completi</h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">
        Warframe, armi e companion consigliati insieme, pronti all&apos;uso.
      </p>

      {!loadouts?.length ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Nessun loadout pubblicato ancora.{' '}
          <Link href="/loadout/nuovo" className="text-accent-400 hover:text-accent-300">
            Creane uno
          </Link>
          .
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(loadouts as Loadout[]).map((l) => (
            <LoadoutCard key={l.id} loadout={l} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## `src/app/(app)/preferiti/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server';
import BuildCard from '@/components/build/BuildCard';
import LoadoutCard from '@/components/loadout/LoadoutCard';
import type { Build, Loadout } from '@/lib/types';

export default async function PreferitiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: buildFavs }, { data: loadoutFavs }] = await Promise.all([
    supabase
      .from('favorites')
      .select('build:builds(*, category:categories(*), author:profiles!builds_author_id_fkey(*))')
      .eq('user_id', user?.id ?? '')
      .not('build_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('favorites')
      .select(
        `loadout:loadouts(*, author:profiles!loadouts_author_id_fkey(*),
         warframe_build:builds!loadouts_warframe_build_id_fkey(*, category:categories(*)),
         companion_build:builds!loadouts_companion_build_id_fkey(*, category:categories(*)))`
      )
      .eq('user_id', user?.id ?? '')
      .not('loadout_id', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  const builds = (buildFavs?.map((f: any) => f.build).filter(Boolean) ?? []) as Build[];
  const loadouts = (loadoutFavs?.map((f: any) => f.loadout).filter(Boolean) ?? []) as Loadout[];
  const isEmpty = builds.length === 0 && loadouts.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Preferiti</h1>
      <p className="text-slate-400 text-sm mb-6">Le build e i loadout che hai salvato.</p>

      {isEmpty ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Non hai ancora salvato nessuna build o loadout.
        </p>
      ) : (
        <>
          {builds.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-medium text-slate-100 mb-3">Build</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {builds.map((b) => (
                  <BuildCard key={b.id} build={b} />
                ))}
              </div>
            </section>
          )}

          {loadouts.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-slate-100 mb-3">Loadout completi</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loadouts.map((l) => (
                  <LoadoutCard key={l.id} loadout={l} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

---

## `src/app/(auth)/login/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Credenziali non valide. Controlla email e password.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center mb-3">
            <span className="text-gold-400 text-xl">◈</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Archivio Build del Clan</h1>
          <p className="text-sm text-slate-400 mt-1">Accedi per consultare le build</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuonome@esempio.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="input-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Non hai un account?{' '}
          <Link href="/register" className="text-accent-400 hover:text-accent-300">
            Richiedi l&apos;accesso
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## `src/app/(auth)/register/page.tsx`

```tsx
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
```

---

## `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    color-scheme: dark;
  }
  body {
    @apply bg-base-950 text-slate-200 antialiased;
  }
  ::selection {
    @apply bg-accent-500/40;
  }
}

@layer components {
  .card {
    @apply bg-base-800 border border-base-600 rounded-xl;
  }
  .btn-primary {
    @apply bg-accent-500 hover:bg-accent-400 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-base-700 hover:bg-base-600 text-slate-100 font-medium px-4 py-2 rounded-lg transition-colors;
  }
  .btn-gold {
    @apply bg-gold-500 hover:bg-gold-400 text-base-950 font-semibold px-4 py-2 rounded-lg transition-colors;
  }
  .input-base {
    @apply w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500/60;
  }
  .badge {
    @apply inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-base-700 text-slate-300 border border-base-600;
  }
  .badge-gold {
    @apply bg-gold-500/15 text-gold-400 border-gold-500/30;
  }
}
```

---

## `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clan Builds — Archivio Warframe',
  description: 'Archivio privato delle build del clan: Warframe, armi e companion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body>{children}</body>
    </html>
  );
}
```

---

## `src/app/page.tsx`

```tsx
// Il middleware (src/middleware.ts) gestisce già il redirect di "/" verso
// /dashboard o /login prima che questa pagina venga renderizzata.
// Questo fallback non dovrebbe quasi mai essere visibile.
export default function Home() {
  return null;
}
```

---

## `src/components/admin/AdminUsersClient.tsx`

```tsx
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
```

---

## `src/components/build/ArchonShardPicker.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

type ShardColor = 'Crimson' | 'Amber' | 'Azure' | 'Topaz' | 'Violet' | 'Emerald';

interface ShardRow {
  id: string;
  color: ShardColor;
  effect: string;
  customEffect: string;
  tauforged: boolean;
  quantity: string;
}

const COLORS: ShardColor[] = ['Crimson', 'Amber', 'Azure', 'Topaz', 'Violet', 'Emerald'];
const CUSTOM = 'Personalizzato…';

// Effetti reali per colore, dalla wiki ufficiale di Warframe (wiki.warframe.com).
// Il valore tra parentesi è il bonus della variante Tauforged.
const EFFECTS: Record<ShardColor, string[]> = {
  Crimson: [
    'Melee Critical Damage +25% (+37.5%)',
    'Primary Status Chance +25% (+37.5%)',
    'Secondary Critical Chance +25% (+37.5%)',
    'Ability Strength +10% (+15%)',
    'Ability Duration +10% (+15%)',
  ],
  Amber: [
    'Max Energy filled on Spawn +30% (+45%)',
    'Effectiveness on Health Orbs +100% (+150%)',
    'Effectiveness on Energy Orbs +50% (+75%)',
    'Casting Speed +25% (+37.5%)',
    'Parkour Velocity +15% (+22.5%)',
  ],
  Azure: [
    'Max Health +150 (+225)',
    'Shield Capacity +150 (+225)',
    'Max Energy +50 (+75)',
    'Armor +150 (+225)',
    'Health Regeneration +5/s (+7.5/s)',
  ],
  Topaz: [
    'Health per kill con danno Blast (max 300 / 450)',
    'Rigenera Scudo su kill con danno Blast (+5 / +7.5)',
    'Secondary Critical Chance per kill con status Heat (max +50% / +75%)',
    'Ability Damage +10% (+15%) su nemici con status Radiation',
  ],
  Violet: [
    'Ability Damage +10% (+15%) su nemici con status Electricity',
    'Primary Electricity Damage +30% (+45%), + bonus per shard Crimson/Azure/Violet equipaggiate',
    'Melee Critical Damage +25% (+37.5%), raddoppia con Energia Max > 500',
    'Health Orb danno Energia, Energy Orb danno Health (+20% / +30%)',
  ],
  Emerald: [
    'Danno da status Toxin +30% (+45%)',
    'Recupera Health per tick di status Toxin (+2 / +3)',
    'Ability Damage +10% (+15%) su nemici con status Corrosion',
    'Stack massimi di Corrosion +2 (+3)',
  ],
};

function emptyRow(): ShardRow {
  return {
    id: crypto.randomUUID(),
    color: 'Crimson',
    effect: EFFECTS.Crimson[0],
    customEffect: '',
    tauforged: false,
    quantity: '1',
  };
}

function buildSummary(rows: ShardRow[]): string {
  return rows
    .map((r) => {
      const effect = r.effect === CUSTOM ? r.customEffect.trim() : r.effect;
      if (!effect) return null;
      const tf = r.tauforged ? 'Tauforged ' : '';
      const qty = r.quantity && r.quantity !== '1' ? `${r.quantity}x ` : '';
      return `${qty}${tf}${r.color} — ${effect}`;
    })
    .filter(Boolean)
    .join('; ');
}

export default function ArchonShardPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (summary: string) => void;
}) {
  // Il DB salva solo la stringa finale: se c'è già un valore testuale legacy
  // (da build create prima di questo componente) lo teniamo come promemoria
  // sola-lettura, e si parte con righe strutturate vuote.
  const [legacyText] = useState(value && !value.includes('—') ? value : null);
  const [rows, setRows] = useState<ShardRow[]>([]);

  useEffect(() => {
    onChange(buildSummary(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function update(id: string, patch: Partial<ShardRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleColorChange(id: string, color: ShardColor) {
    update(id, { color, effect: EFFECTS[color][0] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-300">
          Archon Shards consigliate <span className="text-slate-500">(solo Warframe)</span>
        </label>
        <button onClick={addRow} className="text-xs text-accent-400 hover:text-accent-300">
          + Aggiungi shard
        </button>
      </div>

      {legacyText && (
        <p className="text-xs text-slate-500 mb-2 italic">
          Valore precedente: &quot;{legacyText}&quot; — aggiungi righe qui sotto per sostituirlo.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
            <select
              className="input-base col-span-2 !text-xs"
              value={r.color}
              onChange={(e) => handleColorChange(r.id, e.target.value as ShardColor)}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className={`input-base !text-xs ${
                r.effect === CUSTOM ? 'col-span-5' : 'col-span-6'
              }`}
              value={r.effect}
              onChange={(e) => update(r.id, { effect: e.target.value })}
            >
              {EFFECTS[r.color].map((eff) => (
                <option key={eff} value={eff}>
                  {eff}
                </option>
              ))}
              <option value={CUSTOM}>{CUSTOM}</option>
            </select>
            {r.effect === CUSTOM && (
              <input
                className="input-base col-span-3 !text-xs"
                placeholder="Effetto personalizzato"
                value={r.customEffect}
                onChange={(e) => update(r.id, { customEffect: e.target.value })}
              />
            )}
            <input
              className="input-base col-span-1 !text-xs"
              type="number"
              min={1}
              max={5}
              value={r.quantity}
              onChange={(e) => update(r.id, { quantity: e.target.value })}
              title="Quantità"
            />
            <label className="col-span-2 flex items-center gap-1 text-[10px] text-slate-400">
              <input
                type="checkbox"
                checked={r.tauforged}
                onChange={(e) => update(r.id, { tauforged: e.target.checked })}
              />
              Tauforged
            </label>
            <button
              onClick={() => removeRow(r.id)}
              className="col-span-1 text-slate-500 hover:text-red-400 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-slate-600">Nessuna Archon Shard aggiunta.</p>
        )}
      </div>
    </div>
  );
}
```

---

## `src/components/build/BuildCard.tsx`

```tsx
import Link from 'next/link';
import type { Build } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

export default function BuildCard({ build, fromCategory }: { build: Build; fromCategory?: string }) {
  const categorySlug = build.category?.slug ?? '';
  const categoryLabel = CATEGORY_LABELS[categorySlug] ?? build.category?.label ?? '';
  const href = fromCategory ? `/build/${build.id}?fromCategory=${fromCategory}` : `/build/${build.id}`;

  return (
    <Link
      href={href}
      className="card overflow-hidden hover:border-accent-500/40 transition-colors group flex flex-col"
    >
      <div className="aspect-video bg-base-900 relative overflow-hidden">
        {build.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={build.image_url}
            alt={build.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-slate-600">
            ◈
          </div>
        )}
        {build.status === 'bozza' && (
          <span className="absolute top-2 right-2 badge bg-base-900/80">Bozza</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <span className="text-xs text-gold-400 mb-1">{categoryLabel}</span>
        <h3 className="text-sm font-medium text-slate-100 line-clamp-1">{build.title}</h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{build.item_name}</p>
        {build.tags && build.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {build.tags.slice(0, 3).map((t) => (
              <span key={t.id} className="badge !py-0 !text-[10px]">
                {t.nome}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-700 text-xs text-slate-500">
          <span className="truncate">{build.author?.username ?? '—'}</span>
          <span className="flex items-center gap-1 shrink-0">★ {build.saves_count}</span>
        </div>
      </div>
    </Link>
  );
}
```

---

## `src/components/build/BuildExplorer.tsx`

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Build, Category, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import BuildCard from './BuildCard';

type ViewMode = 'griglia' | 'lista' | 'tabella';
type SortMode = 'recenti' | 'popolari' | 'salvate' | 'alfabetico';

export default function BuildExplorer({ fixedCategorySlug }: { fixedCategorySlug?: string }) {
  const supabase = createClient();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(fixedCategorySlug ?? '');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [sort, setSort] = useState<SortMode>('recenti');
  const [view, setView] = useState<ViewMode>('griglia');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: tagList }] = await Promise.all([
        supabase.from('categories').select('*').order('ordine'),
        supabase.from('tags').select('*').order('nome'),
      ]);
      setCategories(cats ?? []);
      setTags(tagList ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from('builds')
        .select('*, category:categories(*), author:profiles!builds_author_id_fkey(*), build_tags(tag:tags(*))')
        .eq('status', 'pubblicata');

      if (categoryFilter) {
        const cat = categories.find((c) => c.slug === categoryFilter);
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,item_name.ilike.%${search}%`);
      }

      switch (sort) {
        case 'recenti':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popolari':
          query = query.order('views_count', { ascending: false });
          break;
        case 'salvate':
          query = query.order('saves_count', { ascending: false });
          break;
        case 'alfabetico':
          query = query.order('title', { ascending: true });
          break;
      }

      const { data } = await query.limit(60);
      let result = ((data as any[]) ?? []).map((b) => ({
        ...b,
        tags: (b.build_tags ?? []).map((bt: any) => bt.tag).filter(Boolean),
      })) as Build[];

      if (authorFilter.trim()) {
        result = result.filter((b) =>
          b.author?.username.toLowerCase().includes(authorFilter.toLowerCase())
        );
      }

      if (user) {
        const { data: favs } = await supabase
          .from('favorites')
          .select('build_id')
          .eq('user_id', user.id);
        setFavoriteIds(new Set((favs ?? []).map((f) => f.build_id)));
      }

      setBuilds(result);
      setLoading(false);
    })();
  }, [search, categoryFilter, sort, categories]);

  const filteredByTag = useMemo(() => {
    if (!tagFilter) return builds;
    return builds.filter((b) => b.tags?.some((t) => t.nome === tagFilter));
  }, [builds, tagFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          className="input-base md:max-w-xs"
          placeholder="Cerca per titolo o oggetto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!fixedCategorySlug && (
          <select
            className="input-base md:max-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tutte le categorie</option>
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        )}
        <input
          className="input-base md:max-w-[180px]"
          placeholder="Filtra per autore…"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
        />
        <select
          className="input-base md:max-w-[160px]"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">Tutti i tag</option>
          {tags.map((t) => (
            <option key={t.id} value={t.nome}>
              {t.nome}
            </option>
          ))}
        </select>
        <select
          className="input-base md:max-w-[180px]"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
        >
          <option value="recenti">Più recenti</option>
          <option value="popolari">Più popolari</option>
          <option value="salvate">Più salvate</option>
          <option value="alfabetico">Alfabetico</option>
        </select>

        <div className="flex gap-1 md:ml-auto">
          {(['griglia', 'lista', 'tabella'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 rounded-lg text-xs border ${
                view === v
                  ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                  : 'border-base-600 text-slate-400 hover:text-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Caricamento…</p>
      ) : filteredByTag.length === 0 ? (
        <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-base-600 rounded-xl">
          Nessuna build trovata con questi filtri.
        </p>
      ) : view === 'griglia' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredByTag.map((b) => (
            <BuildCard key={b.id} build={b} fromCategory={fixedCategorySlug} />
          ))}
        </div>
      ) : view === 'lista' ? (
        <div className="space-y-2">
          {filteredByTag.map((b) => (
            <Link
              key={b.id}
              href={`/build/${b.id}`}
              className="card flex items-center gap-4 px-4 py-3 hover:border-accent-500/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{b.title}</p>
                <p className="text-xs text-slate-400 truncate">
                  {CATEGORY_LABELS[b.category?.slug ?? ''] ?? ''} · {b.item_name}
                </p>
              </div>
              <span className="text-xs text-slate-500 shrink-0">{b.author?.username}</span>
              <span className="text-xs text-slate-500 shrink-0">★ {b.saves_count}</span>
              {favoriteIds.has(b.id) && <span className="text-gold-400 shrink-0">★</span>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-base-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Titolo</th>
                <th className="text-left px-4 py-2 font-medium">Categoria</th>
                <th className="text-left px-4 py-2 font-medium">Autore</th>
                <th className="text-left px-4 py-2 font-medium">Aggiornata</th>
                <th className="text-left px-4 py-2 font-medium">Salvate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700">
              {filteredByTag.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-base-700/40 cursor-pointer"
                  onClick={() => (window.location.href = `/build/${b.id}`)}
                >
                  <td className="px-4 py-2 text-slate-100">{b.title}</td>
                  <td className="px-4 py-2 text-slate-400">
                    {CATEGORY_LABELS[b.category?.slug ?? ''] ?? ''}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{b.author?.username}</td>
                  <td className="px-4 py-2 text-slate-400">
                    {new Date(b.updated_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{b.saves_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## `src/components/build/BuildForm.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, Category, RailjackData, Tag } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import MarkdownText from '@/components/ui/MarkdownText';
import RailjackFields from './RailjackFields';
import { cleanRailjackData } from '@/lib/railjack';
import ArchonShardPicker from './ArchonShardPicker';
import BuildTypePicker from './BuildTypePicker';
import { getCategoryFieldFlags, getCategoryPlaceholders } from '@/lib/buildFields';

type Step = 1 | 2 | 3 | 4;

export default function BuildForm({ existingBuild }: { existingBuild?: Build }) {
  const supabase = createClient();
  const router = useRouter();
  const isEditing = !!existingBuild;

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Step 0 — scelta del tipo di build (solo in creazione)
  const [showForm, setShowForm] = useState(isEditing);
  const [pendingTypeSlug, setPendingTypeSlug] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState(existingBuild?.title ?? '');
  const [categoryId, setCategoryId] = useState(existingBuild?.category_id ?? '');
  const [itemName, setItemName] = useState(existingBuild?.item_name ?? '');
  const [imageUrl, setImageUrl] = useState(existingBuild?.image_url ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Step 2 — mod: uno o più screenshot con didascalia, più i campi specifici del tipo
  type ModImageEntry = { key: string; id?: string; file: File | null; url: string; caption: string };
  const [modImages, setModImages] = useState<ModImageEntry[]>(
    existingBuild?.mods_image_url
      ? [{ key: 'legacy', file: null, url: existingBuild.mods_image_url, caption: '' }]
      : isEditing
        ? []
        : [{ key: crypto.randomUUID(), file: null, url: '', caption: '' }]
  );
  const [forma, setForma] = useState(existingBuild?.forma ?? '');
  const [stile, setStile] = useState(existingBuild?.stile ?? '');
  const [aura, setAura] = useState(existingBuild?.aura ?? '');
  const [exilus, setExilus] = useState(existingBuild?.exilus ?? '');
  const [arcane, setArcane] = useState(existingBuild?.arcane ?? '');
  const [focusSchool, setFocusSchool] = useState(existingBuild?.focus_school ?? '');
  const [archonShards, setArchonShards] = useState(existingBuild?.archon_shards ?? '');
  const [railjack, setRailjack] = useState<RailjackData>(existingBuild?.railjack ?? {});

  // Step 3
  const [description, setDescription] = useState(existingBuild?.description_md ?? '');
  const [playstyle, setPlaystyle] = useState(existingBuild?.playstyle_md ?? '');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('ordine');
      setCategories(cats ?? []);
      const { data: tagList } = await supabase.from('tags').select('*').order('nome');
      setAllTags(tagList ?? []);

      if (existingBuild) {
        const { data: existingTags } = await supabase
          .from('build_tags')
          .select('tag:tags(*)')
          .eq('build_id', existingBuild.id);
        setSelectedTags((existingTags ?? []).map((t: any) => t.tag?.nome).filter(Boolean));

        const { data: existingModImages } = await supabase
          .from('build_mod_images')
          .select('*')
          .eq('build_id', existingBuild.id)
          .order('ordine');
        if (existingModImages && existingModImages.length > 0) {
          setModImages(
            existingModImages.map((mi: any) => ({
              key: mi.id,
              id: mi.id,
              file: null,
              url: mi.image_url,
              caption: mi.caption ?? '',
            }))
          );
        }
      }
    })();
  }, [existingBuild]);

  // Una volta arrivate le categorie, risolvo lo slug scelto nello step 0 nell'id categoria reale
  useEffect(() => {
    if (pendingTypeSlug && categories.length > 0) {
      const found = categories.find((c) => c.slug === pendingTypeSlug);
      if (found) {
        setCategoryId(found.id);
        setShowForm(true);
        setPendingTypeSlug(null);
      }
    }
  }, [pendingTypeSlug, categories]);

  function chooseType(slug: string) {
    const found = categories.find((c) => c.slug === slug);
    if (found) {
      setCategoryId(found.id);
      setShowForm(true);
    } else {
      // categorie non ancora caricate: le risolvo appena arrivano
      setPendingTypeSlug(slug);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const fieldFlags = getCategoryFieldFlags(selectedCategory?.slug);
  const placeholders = getCategoryPlaceholders(selectedCategory?.slug);

  function toggleTag(name: string) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  function addCustomTag() {
    const clean = tagInput.trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return imageUrl || null;
    const ext = imageFile.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('build-images')
      .upload(path, imageFile);
    if (uploadError) {
      setError('Errore nel caricamento immagine: ' + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from('build-images').getPublicUrl(path);
    return data.publicUrl;
  }

  function addModImageSlot() {
    setModImages((prev) => [...prev, { key: crypto.randomUUID(), file: null, url: '', caption: '' }]);
  }

  function removeModImage(key: string) {
    setModImages((prev) => prev.filter((m) => m.key !== key));
  }

  function updateModImageUrl(key: string, url: string) {
    setModImages((prev) =>
      prev.map((m) => (m.key === key ? { ...m, url, file: url ? null : m.file } : m))
    );
  }

  function updateModImageFile(key: string, file: File | null) {
    setModImages((prev) => prev.map((m) => (m.key === key ? { ...m, file } : m)));
  }

  function updateModImageCaption(key: string, caption: string) {
    setModImages((prev) => prev.map((m) => (m.key === key ? { ...m, caption } : m)));
  }

  async function uploadModImages(): Promise<{ url: string; caption: string }[]> {
    const results: { url: string; caption: string }[] = [];
    for (const entry of modImages) {
      if (entry.file) {
        const ext = entry.file.name.split('.').pop();
        const path = `mods-${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('build-images')
          .upload(path, entry.file);
        if (uploadError) {
          setError('Errore nel caricamento di uno screenshot mod: ' + uploadError.message);
          continue;
        }
        const { data } = supabase.storage.from('build-images').getPublicUrl(path);
        results.push({ url: data.publicUrl, caption: entry.caption });
      } else if (entry.url) {
        results.push({ url: entry.url, caption: entry.caption });
      }
    }
    return results;
  }

  async function persist(status: 'bozza' | 'pubblicata') {
    setError(null);
    if (!title.trim() || !categoryId || !itemName.trim()) {
      setError('Titolo, categoria e nome oggetto sono obbligatori.');
      setStep(1);
      return;
    }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Sessione scaduta, effettua di nuovo il login.');
      setSaving(false);
      return;
    }

    const finalImageUrl = await uploadImageIfNeeded();

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      item_name: itemName.trim(),
      image_url: finalImageUrl,
      status,
      description_md: description,
      playstyle_md: playstyle,
      forma: forma || null,
      stile: stile || null,
      aura: aura || null,
      exilus: exilus || null,
      arcane: arcane || null,
      focus_school: focusSchool || null,
      archon_shards: archonShards || null,
      ...(fieldFlags.showRailjack
        ? { railjack: cleanRailjackData(railjack) }
        : existingBuild?.railjack
          ? { railjack: null }
          : {}),
    };

    let buildId = existingBuild?.id;

    if (isEditing && buildId) {
      const { error: updateError } = await supabase.from('builds').update(payload).eq('id', buildId);
      if (updateError) {
        console.error('Errore aggiornamento build:', updateError);
        setError(
          `Errore durante il salvataggio: ${updateError.message} (codice: ${
            updateError.code ?? '—'
          }). Se il messaggio riguarda una colonna sconosciuta, verifica di aver eseguito tutte le migrazioni SQL su Supabase.`
        );
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('builds')
        .insert({ ...payload, author_id: user.id })
        .select()
        .single();
      if (insertError || !inserted) {
        console.error('Errore creazione build:', insertError);
        setError(
          `Errore durante la creazione: ${insertError?.message ?? 'nessun dettaglio'} (codice: ${
            insertError?.code ?? '—'
          }). Se il messaggio riguarda una colonna o tabella sconosciuta, verifica di aver eseguito tutte le migrazioni SQL su Supabase.`
        );
        setSaving(false);
        return;
      }
      buildId = inserted.id;
    }

    // tag: crea quelli mancanti, poi collega
    await supabase.from('build_tags').delete().eq('build_id', buildId);
    for (const tagName of selectedTags) {
      let { data: existingTag } = await supabase
        .from('tags')
        .select('*')
        .eq('nome', tagName)
        .maybeSingle();
      if (!existingTag) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ nome: tagName })
          .select()
          .single();
        existingTag = newTag;
      }
      if (existingTag) {
        await supabase.from('build_tags').insert({ build_id: buildId, tag_id: existingTag.id });
      }
    }

    // galleria immagini mod: sostituisco tutte le voci con quelle correnti
    const uploadedModImages = await uploadModImages();
    await supabase.from('build_mod_images').delete().eq('build_id', buildId);
    if (uploadedModImages.length > 0) {
      await supabase.from('build_mod_images').insert(
        uploadedModImages.map((img, idx) => ({
          build_id: buildId,
          image_url: img.url,
          caption: img.caption || null,
          ordine: idx,
        }))
      );
    }

    setSaving(false);
    router.push(`/build/${buildId}`);
    router.refresh();
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Info base' },
    { n: 2, label: 'Mod & Forma' },
    { n: 3, label: 'Descrizione & Tag' },
    { n: 4, label: 'Anteprima' },
  ];

  const mainImagePreview = imageFile ? URL.createObjectURL(imageFile) : imageUrl;

  if (!showForm) {
    return <BuildTypePicker onChoose={chooseType} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      {!isEditing && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(false)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ← Torna alle build
          </button>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-slate-100 mb-1">
        {isEditing
          ? 'Modifica build'
          : `Nuova build ${CATEGORY_LABELS[selectedCategory?.slug ?? ''] ?? selectedCategory?.label ?? ''}`}
      </h1>

      <div className="flex items-center gap-2 my-5 overflow-x-auto">
        {steps.map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-colors ${
              step === s.n
                ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                : 'border-base-600 text-slate-400'
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Titolo della build *</label>
            <input
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={placeholders.title}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Categoria *</label>
              {isEditing ? (
                <select
                  className="input-base"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Seleziona…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {CATEGORY_LABELS[c.slug] ?? c.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="input-base flex items-center justify-between">
                  <span>{CATEGORY_LABELS[selectedCategory?.slug ?? ''] ?? selectedCategory?.label}</span>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs text-accent-300 hover:underline shrink-0 ml-2"
                  >
                    Cambia tipo
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nome oggetto *</label>
              <input
                className="input-base"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={placeholders.itemName}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Immagine</label>
            {mainImagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImagePreview}
                alt="Anteprima immagine build"
                className="w-full max-h-56 object-contain rounded-lg border border-base-600 mb-2 bg-base-900"
              />
            )}
            <input
              className="input-base"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) setImageFile(null);
              }}
              placeholder="https://…"
            />
            <p className="text-xs text-slate-500 mt-1">oppure carica un file:</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-400 mt-1"
            />
            {(imageFile || imageUrl) && (
              <p className="text-xs text-emerald-400/80 mt-1">
                ✓ Immagine selezionata — resta collegata anche cambiando schermata.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Configurazione mod</label>
            <p className="text-xs text-slate-500 mb-3">
              Carica uno o più screenshot (es. build diverse per situazioni diverse), ognuno con la
              sua didascalia — come quando pubblichi build su Discord.
            </p>
            <div className="space-y-4">
              {modImages.map((entry, idx) => (
                <div key={entry.key} className="border border-base-600 rounded-lg p-3 space-y-2">
                  {(entry.file || entry.url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.file ? URL.createObjectURL(entry.file) : entry.url}
                      alt={`Screenshot mod ${idx + 1}`}
                      className="w-full max-h-64 object-contain rounded-lg bg-base-900"
                    />
                  )}
                  <input
                    className="input-base"
                    value={entry.url}
                    onChange={(e) => updateModImageUrl(entry.key, e.target.value)}
                    placeholder="https://…"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateModImageFile(entry.key, e.target.files?.[0] ?? null)}
                    className="text-xs text-slate-400"
                  />
                  <input
                    className="input-base"
                    value={entry.caption}
                    onChange={(e) => updateModImageCaption(entry.key, e.target.value)}
                    placeholder='Didascalia (es. "Build A — per il corrosivo")'
                  />
                  <button
                    type="button"
                    onClick={() => removeModImage(entry.key)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Rimuovi immagine
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addModImageSlot} className="btn-secondary mt-3">
              + Aggiungi immagine
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-base-700">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Forma</label>
              <input
                className="input-base"
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                placeholder="es. 3x V, 1x -"
              />
            </div>
            {fieldFlags.showStile && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Stile</label>
                <input
                  className="input-base"
                  value={stile}
                  onChange={(e) => setStile(e.target.value)}
                  placeholder="es. Tempo Royale"
                />
              </div>
            )}
            {fieldFlags.showAura && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Aura</label>
                <input className="input-base" value={aura} onChange={(e) => setAura(e.target.value)} />
              </div>
            )}
            {fieldFlags.showExilus && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Exilus</label>
                <input className="input-base" value={exilus} onChange={(e) => setExilus(e.target.value)} />
              </div>
            )}
            {fieldFlags.showArcane && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Arcane</label>
                <input className="input-base" value={arcane} onChange={(e) => setArcane(e.target.value)} />
              </div>
            )}
            {fieldFlags.showFocusSchool && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Focus School consigliata</label>
                <input
                  className="input-base"
                  value={focusSchool}
                  onChange={(e) => setFocusSchool(e.target.value)}
                />
              </div>
            )}
          </div>

          {fieldFlags.showArchonShards && (
            <div className="pt-2 border-t border-base-700">
              <ArchonShardPicker value={archonShards} onChange={setArchonShards} />
            </div>
          )}

          {fieldFlags.showRailjack && (
            <div className="pt-2 border-t border-base-700">
              <RailjackFields value={railjack} onChange={setRailjack} />
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Descrizione (Markdown)</label>
            <textarea
              className="input-base min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi la build…"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Stile di gioco e casi d&apos;uso (Markdown)</label>
            <textarea
              className="input-base min-h-[100px]"
              value={playstyle}
              onChange={(e) => setPlaystyle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Tag</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allTags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.nome)}
                  className={`badge ${selectedTags.includes(t.nome) ? 'badge-gold' : ''}`}
                >
                  {t.nome}
                </button>
              ))}
              {selectedTags
                .filter((t) => !allTags.some((at) => at.nome === t))
                .map((t) => (
                  <button key={t} onClick={() => toggleTag(t)} className="badge badge-gold">
                    {t}
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-base"
                placeholder="Aggiungi tag personalizzato (es. Steel Path)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              />
              <button onClick={addCustomTag} className="btn-secondary shrink-0">
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-5">
          <p className="text-xs text-slate-500 mb-3">Anteprima — così apparirà la scheda build</p>
          {mainImagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImagePreview}
              alt="Anteprima immagine build"
              className="w-full max-h-56 object-contain rounded-lg border border-base-600 mb-3 bg-base-900"
            />
          )}
          <h2 className="text-xl font-semibold text-slate-100">{title || 'Titolo build'}</h2>
          <p className="text-sm text-slate-400 mb-4">{itemName || 'Nome oggetto'}</p>
          {description && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 mb-3">
              <MarkdownText text={description} />
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((t) => (
              <span key={t} className="badge badge-gold">
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {modImages.length > 0
              ? `${modImages.length} screenshot configurazione mod allegati`
              : 'Nessuno screenshot mod caricato'}
          </p>
          {fieldFlags.showRailjack && (
            <p className="text-xs text-slate-500 mt-1">
              {(() => {
                const d = cleanRailjackData(railjack);
                const nComponents = Object.keys(d?.components ?? {}).length;
                const nArmaments = Object.keys(d?.armaments ?? {}).length;
                const nCrew = d?.crew?.length ?? 0;
                return `Componenti: ${nComponents}/4 · Artiglieria: ${nArmaments}/3 · Equipaggio: ${nCrew}`;
              })()}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-40"
        >
          Indietro
        </button>
        <div className="flex gap-2">
          {step < 4 ? (
            <button onClick={() => setStep((s) => Math.min(4, s + 1) as Step)} className="btn-primary">
              Avanti
            </button>
          ) : (
            <>
              <button onClick={() => persist('bozza')} disabled={saving} className="btn-secondary">
                Salva bozza
              </button>
              <button onClick={() => persist('pubblicata')} disabled={saving} className="btn-gold">
                {saving ? 'Salvataggio…' : 'Pubblica'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## `src/components/build/BuildTypePicker.tsx`

```tsx
'use client';

const TYPE_OPTIONS: { slug: string; label: string; hint: string }[] = [
  { slug: 'warframe', label: 'Warframe', hint: 'Aura, Exilus, Arcane, Focus School, Archon Shards' },
  { slug: 'arma_primaria', label: 'Arma primaria', hint: 'Exilus, Arcane' },
  { slug: 'arma_secondaria', label: 'Arma secondaria', hint: 'Exilus, Arcane' },
  { slug: 'arma_melee', label: 'Arma melee', hint: 'Exilus, Arcane, Stile' },
  { slug: 'arma_exalted', label: 'Arma Exalted', hint: 'Exilus, Arcane' },
  { slug: 'companion', label: 'Companion', hint: 'Solo mod base' },
  { slug: 'arma_companion', label: 'Arma del companion', hint: 'Solo mod base' },
  { slug: 'archgun', label: 'Archgun', hint: 'Solo mod base' },
  { slug: 'archmelee', label: 'Archmelee', hint: 'Solo mod base' },
  { slug: 'archwing', label: 'Archwing', hint: 'Solo mod base' },
  { slug: 'necramech', label: 'Necramech', hint: 'Solo mod base' },
  { slug: 'k_drive', label: 'K-Drive', hint: 'Solo mod base' },
  { slug: 'railjack', label: 'Railjack', hint: 'Aura, componenti, artiglieria, equipaggio' },
];

export default function BuildTypePicker({ onChoose }: { onChoose: (slug: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Nuova build</h1>
      <p className="text-slate-400 text-sm mb-6">
        Che tipo di build vuoi creare? I campi della sezione Mod cambiano in base al tipo.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t.slug}
            onClick={() => onChoose(t.slug)}
            className="card p-4 text-left hover:border-accent-500/50 border border-transparent transition-colors"
          >
            <p className="text-slate-100 font-medium">{t.label}</p>
            <p className="text-xs text-slate-500 mt-1">{t.hint}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## `src/components/build/DeleteBuildButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteBuildButton({ buildId, buildTitle }: { buildId: string; buildTitle: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase.from('builds').delete().eq('id', buildId);

    if (deleteError) {
      setError(`Errore durante l'eliminazione: ${deleteError.message}`);
      setLoading(false);
      return;
    }

    router.push('/build');
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">Eliminare &quot;{buildTitle}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="btn-secondary !bg-red-900/60 !border-red-700 hover:!bg-red-800/60"
        >
          {loading ? 'Eliminazione…' : 'Conferma'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="btn-secondary"
        >
          Annulla
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="btn-secondary !text-red-400 hover:!bg-red-900/30"
    >
      Elimina
    </button>
  );
}
```

---

## `src/components/build/DuplicateButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, BuildMod } from '@/lib/types';

export default function DuplicateButton({ build, mods }: { build: Build; mods: BuildMod[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newBuild, error } = await supabase
      .from('builds')
      .insert({
        title: `${build.title} (copia)`,
        category_id: build.category_id,
        item_name: build.item_name,
        image_url: build.image_url,
        author_id: user.id,
        status: 'bozza',
        description_md: build.description_md,
        playstyle_md: build.playstyle_md,
        forma: build.forma,
        stile: build.stile,
        ...(build.railjack ? { railjack: build.railjack } : {}),
        reattore: build.reattore,
        aura: build.aura,
        exilus: build.exilus,
        arcane: build.arcane,
        focus_school: build.focus_school,
        stats: build.stats,
      })
      .select()
      .single();

    if (error || !newBuild) {
      setLoading(false);
      return;
    }

    if (mods.length) {
      await supabase.from('build_mods').insert(
        mods.map((m) => ({
          build_id: newBuild.id,
          mod_name: m.mod_name,
          rank: m.rank,
          slot: m.slot,
          note: m.note,
          ordine: m.ordine,
        }))
      );
    }

    const { data: existingModImages } = await supabase
      .from('build_mod_images')
      .select('*')
      .eq('build_id', build.id)
      .order('ordine');
    if (existingModImages && existingModImages.length > 0) {
      await supabase.from('build_mod_images').insert(
        existingModImages.map((mi: any) => ({
          build_id: newBuild.id,
          image_url: mi.image_url,
          caption: mi.caption,
          ordine: mi.ordine,
        }))
      );
    }

    router.push(`/build/${newBuild.id}/edit`);
  }

  return (
    <button onClick={handleDuplicate} disabled={loading} className="btn-secondary">
      {loading ? 'Duplicazione…' : 'Duplica'}
    </button>
  );
}
```

---

## `src/components/build/FavoriteButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Target = 'build' | 'loadout';

export default function FavoriteButton({
  targetType,
  targetId,
  initialFavorite,
  savesCount,
}: {
  targetType: Target;
  targetId: string;
  initialFavorite: boolean;
  savesCount: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [count, setCount] = useState(savesCount);
  const [loading, setLoading] = useState(false);

  const column = targetType === 'build' ? 'build_id' : 'loadout_id';

  async function toggle() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Il conteggio (saves_count su builds/loadouts) è gestito da un trigger sul
    // database quando questa riga viene inserita/eliminata — non lo aggiorniamo
    // più da qui, perché per un membro normale un update diretto sulla tabella
    // builds/loadouts verrebbe bloccato in silenzio dalla RLS.
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq(column, targetId);
      setCount((c) => Math.max(0, c - 1));
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, [column]: targetId });
      setCount((c) => c + 1);
      setIsFavorite(true);
    }

    // Invalida la cache di navigazione lato client, così se dopo vai sulla
    // pagina "Preferiti" vedi subito questa build/loadout, senza dover
    // ricaricare manualmente il sito.
    router.refresh();

    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
        isFavorite
          ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
          : 'border-base-600 text-slate-300 hover:text-gold-400 hover:border-gold-500/40'
      }`}
    >
      <span>{isFavorite ? '★' : '☆'}</span>
      {isFavorite ? 'Salvata' : 'Salva'} · {count}
    </button>
  );
}
```

---

## `src/components/build/RailjackFields.tsx`

```tsx
'use client';

import type { RailjackCrewRole, RailjackData } from '@/lib/types';
import {
  RAILJACK_ARMAMENT_LABELS,
  RAILJACK_ARMAMENT_PLACEHOLDERS,
  RAILJACK_COMPONENT_LABELS,
  RAILJACK_COMPONENT_PLACEHOLDERS,
  RAILJACK_CREW_ROLE_LABELS,
  RAILJACK_MAX_CREW,
  type RailjackArmamentKey,
  type RailjackComponentKey,
} from '@/lib/railjack';

const COMPONENT_KEYS = Object.keys(RAILJACK_COMPONENT_LABELS) as RailjackComponentKey[];
const ARMAMENT_KEYS = Object.keys(RAILJACK_ARMAMENT_LABELS) as RailjackArmamentKey[];
const ROLES = Object.keys(RAILJACK_CREW_ROLE_LABELS) as RailjackCrewRole[];

export default function RailjackFields({
  value,
  onChange,
}: {
  value: RailjackData;
  onChange: (v: RailjackData) => void;
}) {
  const crew = value.crew ?? [];

  function setComponent(key: RailjackComponentKey, text: string) {
    onChange({ ...value, components: { ...value.components, [key]: text } });
  }

  function setArmament(key: RailjackArmamentKey, text: string) {
    onChange({ ...value, armaments: { ...value.armaments, [key]: text } });
  }

  function updateMember(index: number, patch: Partial<{ role: RailjackCrewRole; name: string; note: string }>) {
    onChange({ ...value, crew: crew.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  }

  function addMember() {
    if (crew.length >= RAILJACK_MAX_CREW) return;
    onChange({ ...value, crew: [...crew, { role: 'gunner' }] });
  }

  function removeMember(index: number) {
    onChange({ ...value, crew: crew.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-1">Componenti</h3>
        <p className="text-xs text-slate-500 mb-3">
          Scrivi il nome completo come compare nel gioco, con casa e livello (es. Zetki … Mk III).
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {COMPONENT_KEYS.map((key) => (
            <div key={key}>
              <label className="block text-sm text-slate-300 mb-1">{RAILJACK_COMPONENT_LABELS[key]}</label>
              <input
                className="input-base"
                value={value.components?.[key] ?? ''}
                onChange={(e) => setComponent(key, e.target.value)}
                placeholder={RAILJACK_COMPONENT_PLACEHOLDERS[key]}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-1">Artiglieria</h3>
        <p className="text-xs text-slate-500 mb-3">I tre slot di Armaments del Railjack.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {ARMAMENT_KEYS.map((key) => (
            <div key={key}>
              <label className="block text-sm text-slate-300 mb-1">{RAILJACK_ARMAMENT_LABELS[key]}</label>
              <input
                className="input-base"
                value={value.armaments?.[key] ?? ''}
                onChange={(e) => setArmament(key, e.target.value)}
                placeholder={RAILJACK_ARMAMENT_PLACEHOLDERS[key]}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-1">Equipaggio</h3>
        <p className="text-xs text-slate-500 mb-3">
          Aggiungi i membri dell&apos;equipaggio con il ruolo che hanno nella build (massimo {RAILJACK_MAX_CREW}).
        </p>
        <div className="space-y-3">
          {crew.map((member, index) => (
            <div key={index} className="border border-base-600 rounded-lg p-3 grid sm:grid-cols-[10rem_1fr_1fr_auto] gap-2 items-center">
              <select
                className="input-base"
                value={member.role}
                onChange={(e) => updateMember(index, { role: e.target.value as RailjackCrewRole })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {RAILJACK_CREW_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <input
                className="input-base"
                value={member.name ?? ''}
                onChange={(e) => updateMember(index, { name: e.target.value })}
                placeholder="Nome del membro"
              />
              <input
                className="input-base"
                value={member.note ?? ''}
                onChange={(e) => updateMember(index, { note: e.target.value })}
                placeholder="Note (es. tratto Elite, intrinseci)"
              />
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-xs text-red-400 hover:underline justify-self-start"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        {crew.length < RAILJACK_MAX_CREW && (
          <button type="button" onClick={addMember} className="btn-secondary mt-3">
            + Aggiungi membro
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## `src/components/build/RailjackSection.tsx`

```tsx
import type { RailjackData } from '@/lib/types';
import {
  RAILJACK_ARMAMENT_LABELS,
  RAILJACK_COMPONENT_LABELS,
  RAILJACK_CREW_ROLE_LABELS,
  cleanRailjackData,
  type RailjackArmamentKey,
  type RailjackComponentKey,
} from '@/lib/railjack';

const COMPONENT_KEYS = Object.keys(RAILJACK_COMPONENT_LABELS) as RailjackComponentKey[];
const ARMAMENT_KEYS = Object.keys(RAILJACK_ARMAMENT_LABELS) as RailjackArmamentKey[];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-100">{value}</p>
    </div>
  );
}

/** Mostra componenti, artiglieria ed equipaggio di una build Railjack (solo le parti compilate). */
export default function RailjackSection({ data }: { data: RailjackData | null | undefined }) {
  const d = cleanRailjackData(data);
  if (!d) return null;

  const components = COMPONENT_KEYS.filter((k) => d.components?.[k]);
  const armaments = ARMAMENT_KEYS.filter((k) => d.armaments?.[k]);
  const crew = d.crew ?? [];

  return (
    <section className="mb-6 space-y-5">
      {components.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-100 mb-2">Componenti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {components.map((k) => (
              <Row key={k} label={RAILJACK_COMPONENT_LABELS[k]} value={d.components![k]!} />
            ))}
          </div>
        </div>
      )}

      {armaments.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-100 mb-2">Artiglieria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {armaments.map((k) => (
              <Row key={k} label={RAILJACK_ARMAMENT_LABELS[k]} value={d.armaments![k]!} />
            ))}
          </div>
        </div>
      )}

      {crew.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-100 mb-2">Equipaggio</h2>
          <div className="space-y-2">
            {crew.map((m, i) => (
              <div key={i} className="card px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="badge badge-gold">{RAILJACK_CREW_ROLE_LABELS[m.role] ?? m.role}</span>
                {m.name && <span className="text-sm text-slate-100">{m.name}</span>}
                {m.note && <span className="text-sm text-slate-400">{m.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
```

---

## `src/components/comments/CommentSection.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Comment } from '@/lib/types';

type Props = { buildId: string; loadoutId?: never } | { buildId?: never; loadoutId: string };

export default function CommentSection(props: Props) {
  const supabase = createClient();
  const column = 'buildId' in props && props.buildId ? 'build_id' : 'loadout_id';
  const targetId = ('buildId' in props ? props.buildId : props.loadoutId) as string;

  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*)')
      .eq(column, targetId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, [targetId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !currentUserId) return;
    setPosting(true);
    await supabase.from('comments').insert({
      [column]: targetId,
      author_id: currentUserId,
      content: content.trim(),
    });
    setContent('');
    await load();
    setPosting(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('comments').delete().eq('id', id);
    await load();
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium text-slate-100 mb-3">
        Commenti {comments.length > 0 && `(${comments.length})`}
      </h2>

      <form onSubmit={handleSubmit} className="mb-5 flex gap-2">
        <input
          className="input-base"
          placeholder="Scrivi un commento, una domanda o un suggerimento…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit" disabled={posting || !content.trim()} className="btn-primary shrink-0">
          Invia
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Caricamento commenti…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500">Nessun commento ancora. Sii il primo!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="card px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-200">{c.author?.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(c.created_at).toLocaleDateString('it-IT')}
                  </span>
                  {c.author_id === currentUserId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-slate-500 hover:text-red-400"
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

---

## `src/components/layout/Breadcrumbs.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_LABELS } from '@/lib/types';

type Crumb = { label: string; href?: string };
type SupabaseClient = ReturnType<typeof createClient>;

async function fetchTitle(
  table: 'builds' | 'loadouts',
  id: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data } = await supabase.from(table).select('title').eq('id', id).maybeSingle();
  return data?.title ?? '…';
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // cache di sessione dei titoli già risolti, per non rifare la query ogni volta
  const titleCache = useRef<Map<string, string>>(new Map());
  const [, forceRender] = useState(0);

  function getTitle(table: 'builds' | 'loadouts', id: string): string {
    const key = `${table}:${id}`;
    const cached = titleCache.current.get(key);
    if (cached) return cached;
    fetchTitle(table, id, supabase).then((title) => {
      titleCache.current.set(key, title);
      forceRender((n) => n + 1);
    });
    return '…';
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0 || pathname === '/dashboard') return null;

  const crumbs: Crumb[] = [{ label: 'Home', href: '/dashboard' }];

  if (segments[0] === 'build') {
    if (segments.length === 1) {
      crumbs.push({ label: 'Build' });
    } else if (segments[1] === 'nuova') {
      crumbs.push({ label: 'Build', href: '/build' });
      crumbs.push({ label: 'Nuova build' });
    } else {
      const buildId = segments[1];
      const isEdit = segments[2] === 'edit';
      const fromLoadout = searchParams.get('fromLoadout');
      const fromCategory = searchParams.get('fromCategory');
      const buildTitle = getTitle('builds', buildId);

      if (fromLoadout) {
        const loadoutTitle = getTitle('loadouts', fromLoadout);
        crumbs.push({ label: 'Loadout', href: '/loadout' });
        crumbs.push({ label: loadoutTitle, href: `/loadout/${fromLoadout}` });
      } else if (fromCategory) {
        crumbs.push({
          label: CATEGORY_LABELS[fromCategory] ?? fromCategory,
          href: `/categoria/${fromCategory}`,
        });
      } else {
        crumbs.push({ label: 'Build', href: '/build' });
      }

      crumbs.push({ label: buildTitle, href: isEdit ? `/build/${buildId}` : undefined });
      if (isEdit) crumbs.push({ label: 'Modifica' });
    }
  } else if (segments[0] === 'categoria') {
    const slug = segments[1];
    crumbs.push({ label: 'Categorie' });
    crumbs.push({ label: CATEGORY_LABELS[slug] ?? slug });
  } else if (segments[0] === 'loadout') {
    if (segments.length === 1) {
      crumbs.push({ label: 'Loadout' });
    } else if (segments[1] === 'nuovo') {
      crumbs.push({ label: 'Loadout', href: '/loadout' });
      crumbs.push({ label: 'Nuovo loadout' });
    } else {
      const loadoutId = segments[1];
      const isEdit = segments[2] === 'edit';
      const loadoutTitle = getTitle('loadouts', loadoutId);
      crumbs.push({ label: 'Loadout', href: '/loadout' });
      crumbs.push({ label: loadoutTitle, href: isEdit ? `/loadout/${loadoutId}` : undefined });
      if (isEdit) crumbs.push({ label: 'Modifica' });
    }
  } else if (segments[0] === 'preferiti') {
    crumbs.push({ label: 'Preferiti' });
  } else if (segments[0] === 'admin') {
    crumbs.push({ label: 'Amministrazione' });
    if (segments[1] === 'utenti') crumbs.push({ label: 'Utenti' });
  } else {
    return null;
  }

  return (
    <nav className="px-4 md:px-8 pt-4 pb-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-700">/</span>}
          {c.href ? (
            <Link href={c.href} className="hover:text-slate-300">
              {c.label}
            </Link>
          ) : (
            <span className="text-slate-300">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

---

## `src/components/layout/MobileNav.tsx`

```tsx
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
      {item('/loadout', '⬡', 'Loadout')}
      {canEdit && item('/build/nuova', '+', 'Nuova')}
      {item('/preferiti', '★', 'Preferiti')}
    </nav>
  );
}
```

---

## `src/components/layout/Sidebar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

const categories = Object.entries(CATEGORY_LABELS);

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const canEdit = profile.role === 'editor' || profile.role === 'admin';
  const isAdmin = profile.role === 'admin';

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const linkClass = (href: string) =>
    clsx(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
      pathname === href
        ? 'bg-accent-500/15 text-accent-300 border border-accent-500/30'
        : 'text-slate-400 hover:text-slate-100 hover:bg-base-800'
    );

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-base-900 border-r border-base-700 h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-base-700">
        <div className="flex items-center gap-2">
          <span className="text-gold-400 text-lg">◈</span>
          <span className="font-semibold text-slate-100 truncate">Archivio del Clan</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <Link href="/dashboard" className={linkClass('/dashboard')}>
          <span>▣</span> Dashboard
        </Link>
        <Link href="/build" className={linkClass('/build')}>
          <span>▤</span> Tutte le build
        </Link>
        <Link href="/loadout" className={linkClass('/loadout')}>
          <span>⬡</span> Loadout completi
        </Link>

        <div className="pt-4 pb-1 px-3 text-xs uppercase tracking-wide text-slate-500">
          Categorie
        </div>
        {categories.map(([slug, label]) => (
          <Link key={slug} href={`/categoria/${slug}`} className={linkClass(`/categoria/${slug}`)}>
            <span>–</span> {label}
          </Link>
        ))}

        <div className="pt-4">
          <Link href="/preferiti" className={linkClass('/preferiti')}>
            <span>★</span> Preferiti
          </Link>
        </div>

        {isAdmin && (
          <div className="pt-4">
            <div className="pb-1 px-3 text-xs uppercase tracking-wide text-slate-500">
              Amministrazione
            </div>
            <Link href="/admin/utenti" className={linkClass('/admin/utenti')}>
              <span>⚙</span> Utenti
            </Link>
          </div>
        )}
      </nav>

      {canEdit && (
        <div className="px-3 pb-3 space-y-1.5">
          <button
            onClick={() => {
              if (pathname === '/build/nuova') {
                router.push(`/build/nuova?r=${Date.now()}`);
              } else {
                router.push('/build/nuova');
              }
            }}
            className="btn-gold w-full flex items-center justify-center gap-1.5"
          >
            <span>+</span> Nuova build
          </button>
          <Link
            href="/loadout/nuovo"
            className="btn-secondary w-full flex items-center justify-center gap-1.5 !text-xs"
          >
            <span>+</span> Nuovo loadout
          </Link>
        </div>
      )}

      <div className="px-3 py-3 border-t border-base-700 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-200 truncate">{profile.username}</p>
          <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
```

---

## `src/components/loadout/BuildPicker.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Build } from '@/lib/types';

export default function BuildPicker({
  categorySlug,
  value,
  onChange,
  placeholder = 'Cerca una build esistente…',
}: {
  categorySlug: string;
  value: Build | null;
  onChange: (build: Build | null) => void;
  placeholder?: string;
}) {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Build[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      let q = supabase
        .from('builds')
        .select('*, category:categories(*)')
        .eq('status', 'pubblicata')
        .eq('category.slug', categorySlug)
        .limit(8);
      if (query.trim()) {
        q = q.or(`title.ilike.%${query}%,item_name.ilike.%${query}%`);
      }
      const { data } = await q;
      // filtro extra: il join su category.slug non è filtrabile direttamente in tutte le versioni,
      // quindi ricontrolliamo lato client per sicurezza
      setResults(((data as Build[]) ?? []).filter((b) => b.category?.slug === categorySlug));
    })();
  }, [query, open, categorySlug]);

  if (value) {
    return (
      <div className="flex items-center gap-2 card px-3 py-2">
        <span className="text-sm text-slate-100 truncate flex-1">
          {value.title} <span className="text-slate-500">· {value.item_name}</span>
        </span>
        <button
          onClick={() => onChange(null)}
          className="text-xs text-slate-500 hover:text-red-400 shrink-0"
        >
          Rimuovi collegamento
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="input-base"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full card overflow-hidden max-h-56 overflow-y-auto">
          {results.map((b) => (
            <button
              key={b.id}
              onMouseDown={() => {
                onChange(b);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-base-700/60 border-b border-base-700 last:border-0"
            >
              {b.title} <span className="text-slate-500">· {b.item_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## `src/components/loadout/DeleteLoadoutButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteLoadoutButton({
  loadoutId,
  loadoutTitle,
}: {
  loadoutId: string;
  loadoutTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase.from('loadouts').delete().eq('id', loadoutId);

    if (deleteError) {
      setError(`Errore durante l'eliminazione: ${deleteError.message}`);
      setLoading(false);
      return;
    }

    router.push('/loadout');
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">Eliminare &quot;{loadoutTitle}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="btn-secondary !bg-red-900/60 !border-red-700 hover:!bg-red-800/60"
        >
          {loading ? 'Eliminazione…' : 'Conferma'}
        </button>
        <button onClick={() => setConfirming(false)} disabled={loading} className="btn-secondary">
          Annulla
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="btn-secondary !text-red-400 hover:!bg-red-900/30"
    >
      Elimina
    </button>
  );
}
```

---

## `src/components/loadout/LoadoutCard.tsx`

```tsx
import Link from 'next/link';
import type { Loadout } from '@/lib/types';

export default function LoadoutCard({ loadout }: { loadout: Loadout }) {
  const warframeName = loadout.warframe_build?.title ?? loadout.warframe_item_name ?? '—';
  const companionName = loadout.companion_build?.title ?? loadout.companion_item_name ?? null;

  return (
    <Link
      href={`/loadout/${loadout.id}`}
      className="card overflow-hidden hover:border-accent-500/40 transition-colors group flex flex-col"
    >
      <div className="aspect-video bg-base-900 relative overflow-hidden">
        {loadout.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loadout.image_url}
            alt={loadout.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-slate-600">
            ⬡
          </div>
        )}
        {loadout.status === 'bozza' && (
          <span className="absolute top-2 right-2 badge bg-base-900/80">Bozza</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <span className="text-xs text-gold-400 mb-1">Loadout completo</span>
        <h3 className="text-sm font-medium text-slate-100 line-clamp-1">{loadout.title}</h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{warframeName}</p>
        {companionName && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Companion: {companionName}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-700 text-xs text-slate-500">
          <span className="truncate">{loadout.author?.username ?? '—'}</span>
          <span className="shrink-0 ml-2">★ {loadout.saves_count ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
```

---

## `src/components/loadout/LoadoutForm.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Build, Loadout, LoadoutWeapon, WeaponSlot } from '@/lib/types';
import { preserveLineBreaks } from '@/lib/markdown';
import MarkdownText from '@/components/ui/MarkdownText';
import BuildPicker from './BuildPicker';

type Step = 1 | 2 | 3 | 4 | 5;
type LinkMode = 'build' | 'testo';

interface WeaponRow {
  id: string;
  slot: WeaponSlot;
  mode: LinkMode;
  build: Build | null;
  itemName: string;
}

const slotLabels: Record<WeaponSlot, string> = {
  primaria: 'Arma primaria',
  secondaria: 'Arma secondaria',
  melee: 'Arma melee',
  exalted: 'Arma Exalted',
};

const slotCategorySlug: Record<WeaponSlot, string> = {
  primaria: 'arma_primaria',
  secondaria: 'arma_secondaria',
  melee: 'arma_melee',
  exalted: 'arma_exalted',
};

const emptyWeapon = (slot: WeaponSlot): WeaponRow => ({
  id: crypto.randomUUID(),
  slot,
  mode: 'build',
  build: null,
  itemName: '',
});

export default function LoadoutForm({ existingLoadout }: { existingLoadout?: Loadout }) {
  const supabase = createClient();
  const router = useRouter();
  const isEditing = !!existingLoadout;

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState(existingLoadout?.title ?? '');
  const [imageUrl, setImageUrl] = useState(existingLoadout?.image_url ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Step 2 — Warframe (solo da build esistente: i dati mod arrivano dalla build collegata)
  const [warframeBuild, setWarframeBuild] = useState<Build | null>(
    existingLoadout?.warframe_build ?? null
  );

  // Step 3 — Armi
  const [weapons, setWeapons] = useState<WeaponRow[]>([emptyWeapon('primaria')]);

  // Step 4 — Companion
  const [companionMode, setCompanionMode] = useState<LinkMode>(
    existingLoadout?.companion_build_id ? 'build' : 'testo'
  );
  const [companionBuild, setCompanionBuild] = useState<Build | null>(
    existingLoadout?.companion_build ?? null
  );
  const [companionItemName, setCompanionItemName] = useState(existingLoadout?.companion_item_name ?? '');
  const [companionWeaponMode, setCompanionWeaponMode] = useState<LinkMode>(
    existingLoadout?.companion_weapon_build_id ? 'build' : 'testo'
  );
  const [companionWeaponBuild, setCompanionWeaponBuild] = useState<Build | null>(
    existingLoadout?.companion_weapon_build ?? null
  );
  const [companionWeaponItemName, setCompanionWeaponItemName] = useState(
    existingLoadout?.companion_weapon_item_name ?? ''
  );

  // Step 5
  const [notes, setNotes] = useState(existingLoadout?.notes_md ?? '');

  useEffect(() => {
    if (!existingLoadout) return;
    (async () => {
      const { data: existingWeapons } = await supabase
        .from('loadout_weapons')
        .select('*, build:builds(*)')
        .eq('loadout_id', existingLoadout.id)
        .order('ordine');
      if (existingWeapons?.length) {
        setWeapons(
          (existingWeapons as LoadoutWeapon[]).map((w) => ({
            id: w.id,
            slot: w.slot,
            mode: w.build_id ? 'build' : 'testo',
            build: w.build ?? null,
            itemName: w.item_name ?? '',
          }))
        );
      }
    })();
  }, [existingLoadout]);

  function addWeapon(slot: WeaponSlot) {
    setWeapons((prev) => [...prev, emptyWeapon(slot)]);
  }

  function removeWeapon(id: string) {
    setWeapons((prev) => prev.filter((w) => w.id !== id));
  }

  function updateWeaponSlot(id: string, slot: WeaponSlot) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, slot, build: null, itemName: '' } : w)));
  }

  function updateWeaponMode(id: string, mode: LinkMode) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, mode } : w)));
  }

  function updateWeaponBuild(id: string, build: Build | null) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, build } : w)));
  }

  function updateWeaponName(id: string, itemName: string) {
    setWeapons((prev) => prev.map((w) => (w.id === id ? { ...w, itemName } : w)));
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return imageUrl || null;
    const ext = imageFile.name.split('.').pop();
    const path = `loadout-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('build-images').upload(path, imageFile);
    if (uploadError) {
      setError('Errore nel caricamento immagine: ' + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from('build-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function persist(status: 'bozza' | 'pubblicata') {
    setError(null);
    if (!title.trim()) {
      setError('Il titolo del loadout è obbligatorio.');
      setStep(1);
      return;
    }
    if (!warframeBuild) {
      setError('Seleziona una build Warframe esistente.');
      setStep(2);
      return;
    }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Sessione scaduta, effettua di nuovo il login.');
      setSaving(false);
      return;
    }

    const finalImageUrl = await uploadImageIfNeeded();

    const payload = {
      title: title.trim(),
      status,
      image_url: finalImageUrl,
      notes_md: notes,
      warframe_build_id: warframeBuild.id,
      warframe_item_name: null,
      warframe_forma: null,
      warframe_polarity: null,
      warframe_aura: null,
      warframe_exilus: null,
      warframe_arcane: null,
      warframe_archon_shards: null,
      warframe_focus_school: null,
      companion_build_id: companionMode === 'build' ? companionBuild?.id ?? null : null,
      companion_item_name: companionMode === 'testo' ? companionItemName || null : null,
      companion_weapon_build_id:
        companionWeaponMode === 'build' ? companionWeaponBuild?.id ?? null : null,
      companion_weapon_item_name:
        companionWeaponMode === 'testo' ? companionWeaponItemName || null : null,
    };

    let loadoutId = existingLoadout?.id;

    if (isEditing && loadoutId) {
      const { error: updateError } = await supabase.from('loadouts').update(payload).eq('id', loadoutId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
      await supabase.from('loadout_weapons').delete().eq('loadout_id', loadoutId);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('loadouts')
        .insert({ ...payload, author_id: user.id })
        .select()
        .single();
      if (insertError || !inserted) {
        setError(insertError?.message ?? 'Errore durante la creazione.');
        setSaving(false);
        return;
      }
      loadoutId = inserted.id;
    }

    const weaponsToInsert = weapons
      .filter((w) => (w.mode === 'build' ? w.build : w.itemName.trim()))
      .map((w, i) => ({
        loadout_id: loadoutId,
        slot: w.slot,
        build_id: w.mode === 'build' ? w.build?.id ?? null : null,
        item_name: w.mode === 'testo' ? w.itemName.trim() : null,
        ordine: i,
      }));
    if (weaponsToInsert.length) {
      await supabase.from('loadout_weapons').insert(weaponsToInsert);
    }

    setSaving(false);
    router.push(`/loadout/${loadoutId}`);
    router.refresh();
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Info base' },
    { n: 2, label: 'Warframe' },
    { n: 3, label: 'Armi' },
    { n: 4, label: 'Companion' },
    { n: 5, label: 'Note & Anteprima' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">
        {isEditing ? 'Modifica loadout' : 'Nuovo loadout completo'}
      </h1>
      <p className="text-slate-400 text-sm mb-1">
        Warframe + armi + companion consigliati, in un&apos;unica scheda.
      </p>

      <div className="flex items-center gap-2 my-5 overflow-x-auto">
        {steps.map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-colors ${
              step === s.n
                ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
                : 'border-base-600 text-slate-400'
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Titolo del loadout *</label>
            <input
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Saryn Spore Spam — Loadout completo Steel Path"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Immagine (URL)</label>
            <input
              className="input-base"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-slate-500 mt-1">oppure carica un file:</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-400 mt-1"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Build Warframe *</label>
            <p className="text-xs text-slate-500 mb-2">
              Seleziona una build Warframe già pubblicata nell&apos;archivio — Forma, Aura, Exilus,
              Arcane, Focus School e Archon Shards vengono presi automaticamente da quella build.
            </p>
            <BuildPicker
              categorySlug="warframe"
              value={warframeBuild}
              onChange={setWarframeBuild}
              placeholder="Cerca una build Warframe pubblicata…"
            />
          </div>

          {warframeBuild && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-base-700 text-sm">
              {warframeBuild.forma && <MiniProp label="Forma" value={warframeBuild.forma} />}
              {warframeBuild.aura && <MiniProp label="Aura" value={warframeBuild.aura} />}
              {warframeBuild.exilus && <MiniProp label="Exilus" value={warframeBuild.exilus} />}
              {warframeBuild.arcane && <MiniProp label="Arcane" value={warframeBuild.arcane} />}
              {warframeBuild.focus_school && (
                <MiniProp label="Focus School" value={warframeBuild.focus_school} />
              )}
              {warframeBuild.archon_shards && (
                <MiniProp label="Archon Shards" value={warframeBuild.archon_shards} />
              )}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="card p-5 space-y-5">
          <p className="text-xs text-slate-500">
            Aggiungi una o più armi consigliate per ogni slot. Ogni riga può collegarsi a una build
            già presente nell&apos;archivio oppure indicare solo il nome dell&apos;arma.
          </p>

          {(['primaria', 'secondaria', 'melee', 'exalted'] as WeaponSlot[]).map((slot) => (
            <div key={slot}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">{slotLabels[slot]}</label>
                <button
                  onClick={() => addWeapon(slot)}
                  className="text-xs text-accent-400 hover:text-accent-300"
                >
                  + Aggiungi
                </button>
              </div>
              <div className="space-y-2">
                {weapons
                  .filter((w) => w.slot === slot)
                  .map((w) => (
                    <div key={w.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <ModeToggle
                          mode={w.mode}
                          onChange={(m) => updateWeaponMode(w.id, m)}
                          compact
                        />
                        <div className="mt-1">
                          {w.mode === 'build' ? (
                            <BuildPicker
                              categorySlug={slotCategorySlug[slot]}
                              value={w.build}
                              onChange={(b) => updateWeaponBuild(w.id, b)}
                            />
                          ) : (
                            <input
                              className="input-base"
                              placeholder="Nome arma"
                              value={w.itemName}
                              onChange={(e) => updateWeaponName(w.id, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeWeapon(w.id)}
                        className="text-slate-500 hover:text-red-400 text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                {weapons.filter((w) => w.slot === slot).length === 0 && (
                  <p className="text-xs text-slate-600">Nessuna arma aggiunta per questo slot.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="card p-5 space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Companion</label>
            <ModeToggle mode={companionMode} onChange={setCompanionMode} />
            <div className="mt-2">
              {companionMode === 'build' ? (
                <BuildPicker
                  categorySlug="companion"
                  value={companionBuild}
                  onChange={setCompanionBuild}
                  placeholder="Cerca una build companion pubblicata…"
                />
              ) : (
                <input
                  className="input-base"
                  placeholder="Nome companion"
                  value={companionItemName}
                  onChange={(e) => setCompanionItemName(e.target.value)}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Arma del companion</label>
            <ModeToggle mode={companionWeaponMode} onChange={setCompanionWeaponMode} />
            <div className="mt-2">
              {companionWeaponMode === 'build' ? (
                <BuildPicker
                  categorySlug="arma_companion"
                  value={companionWeaponBuild}
                  onChange={setCompanionWeaponBuild}
                  placeholder="Cerca una build arma companion pubblicata…"
                />
              ) : (
                <input
                  className="input-base"
                  placeholder="Nome arma companion"
                  value={companionWeaponItemName}
                  onChange={(e) => setCompanionWeaponItemName(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card p-5 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Note generali (Markdown)</label>
            <textarea
              className="input-base min-h-[120px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Strategia generale, ordine delle abilità, consigli d'uso…"
            />
          </div>

          <div className="pt-3 border-t border-base-700">
            <p className="text-xs text-slate-500 mb-3">Anteprima riassuntiva</p>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">{title || 'Titolo loadout'}</h2>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>
                <span className="text-slate-500">Warframe:</span>{' '}
                {warframeBuild?.title ?? 'non selezionato'}
              </li>
              <li>
                <span className="text-slate-500">Armi:</span>{' '}
                {weapons.filter((w) => (w.mode === 'build' ? w.build : w.itemName.trim())).length}{' '}
                consigliate
              </li>
              <li>
                <span className="text-slate-500">Companion:</span>{' '}
                {companionMode === 'build'
                  ? companionBuild?.title ?? 'non selezionato'
                  : companionItemName || 'non specificato'}
              </li>
            </ul>
            {notes && (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 mt-3">
                <MarkdownText text={notes} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-40"
        >
          Indietro
        </button>
        <div className="flex gap-2">
          {step < 5 ? (
            <button onClick={() => setStep((s) => Math.min(5, s + 1) as Step)} className="btn-primary">
              Avanti
            </button>
          ) : (
            <>
              <button onClick={() => persist('bozza')} disabled={saving} className="btn-secondary">
                Salva bozza
              </button>
              <button onClick={() => persist('pubblicata')} disabled={saving} className="btn-gold">
                {saving ? 'Salvataggio…' : 'Pubblica'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniProp({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
  compact,
}: {
  mode: LinkMode;
  onChange: (m: LinkMode) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onChange('build')}
        className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
          mode === 'build'
            ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
            : 'border-base-600 text-slate-400'
        }`}
      >
        Build esistente
      </button>
      <button
        onClick={() => onChange('testo')}
        className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
          mode === 'testo'
            ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
            : 'border-base-600 text-slate-400'
        }`}
      >
        Solo nome
      </button>
    </div>
  );
}
```

---

## `src/components/ui/AccessDenied.tsx`

```tsx
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
```

---

## `src/components/ui/MarkdownText.tsx`

```tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { preserveLineBreaks } from '@/lib/markdown';

/**
 * Wrapper unico per mostrare testo Markdown scritto dagli utenti (descrizioni,
 * stile di gioco, note dei loadout, ecc.).
 *
 * Il margine tra paragrafi viene forzato con uno stile inline (style=...)
 * invece che con una classe Tailwind, così funziona sempre a prescindere
 * da come è configurato il CSS del resto del progetto.
 */
export default function MarkdownText({ text }: { text: string | null | undefined }) {
  if (!text) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p style={{ marginBottom: '1rem' }} {...props} />,
      }}
    >
      {preserveLineBreaks(text)}
    </ReactMarkdown>
  );
}
```

---

## `src/lib/buildFields.ts`

```ts
export interface CategoryFieldFlags {
  showAura: boolean;
  showExilus: boolean;
  showArcane: boolean;
  showFocusSchool: boolean;
  showArchonShards: boolean;
  showStile: boolean;
  showRailjack: boolean;
}

/**
 * Ogni tipo di equipaggiamento ha slot di mod diversi:
 * - Warframe: Aura, Exilus (con Adapter), Arcane, Focus School (Operator), Archon Shards
 * - Armi primarie/secondarie: Exilus (con Exilus Weapon Adapter), Arcane (con Arcane Adapter). Niente Aura/Focus/Archon.
 * - Armi melee: come sopra + Stile (slot Stance, esclusivo del melee)
 * - Armi Exalted (Exalted Blade, Regulators, Talons, ecc.): hanno SEMPRE lo slot Arcane
 *   (aggiunto a tutte le Exalted Weapon); l'Exilus è specifico delle Exalted primarie/secondarie,
 *   ma essendo un'unica categoria lo mostriamo comunque come campo opzionale. Niente Aura/Focus/
 *   Archon/Stile (le Exalted melee usano lo stance dell'arma melee equipaggiata, non uno slot proprio).
 * - Companion e armi companion: solo gli slot mod base (Precept per il companion) — niente Aura/Exilus/Arcane/Focus/Archon/Stile
 * - Archgun, Archmelee e Archwing: solo gli 8 slot mod base, nessuno slot speciale (confermato dalla wiki ufficiale)
 * - Necramech: 12 slot mod generici, nessuno slot speciale. K-Drive: 8 slot generici, nessuno slot speciale.
 * - Railjack: il Plexus (la sua "configurazione mod") ha 8 slot, uno slot Aura e le sezioni Battle e Tactical;
 *   in più il Railjack ha componenti, artiglieria ed equipaggio (blocco dedicato, showRailjack).
 */
export function getCategoryFieldFlags(slug: string | undefined): CategoryFieldFlags {
  const isWarframe = slug === 'warframe';
  const isMelee = slug === 'arma_melee';
  const isExalted = slug === 'arma_exalted';
  const isRailjack = slug === 'railjack';
  const isWeapon = slug === 'arma_primaria' || slug === 'arma_secondaria' || slug === 'arma_melee';

  return {
    showAura: isWarframe || isRailjack,
    showExilus: isWarframe || isWeapon || isExalted,
    showArcane: isWarframe || isWeapon || isExalted,
    showFocusSchool: isWarframe,
    showArchonShards: isWarframe,
    showStile: isMelee,
    showRailjack: isRailjack,
  };
}

export interface CategoryPlaceholders {
  title: string;
  itemName: string;
}

/** Placeholder di esempio realistici per ogni tipo, per guidare chi compila il form. */
export function getCategoryPlaceholders(slug: string | undefined): CategoryPlaceholders {
  switch (slug) {
    case 'warframe':
      return { title: 'es. Saryn Spore Spam Steel Path', itemName: 'es. Saryn Prime' };
    case 'arma_primaria':
      return { title: 'es. Braton Corrosivo Slash', itemName: 'es. Braton Prime' };
    case 'arma_secondaria':
      return { title: 'es. Lex Headshot Crit', itemName: 'es. Lex Prime' };
    case 'arma_melee':
      return { title: 'es. Nikana Combo Duration', itemName: 'es. Nikana Prime' };
    case 'arma_exalted':
      return { title: 'es. Exalted Blade Crit Build', itemName: 'es. Exalted Blade' };
    case 'companion':
      return { title: 'es. Panzer Tank Build', itemName: 'es. Panzer Vulpaphyla' };
    case 'arma_companion':
      return { title: 'es. Verglas Status Build', itemName: 'es. Verglas' };
    case 'archgun':
      return { title: 'es. Imperator Vandal Corpus Killer', itemName: 'es. Imperator Vandal' };
    case 'archmelee':
      return { title: 'es. Prisma Veritux Archwing Build', itemName: 'es. Prisma Veritux' };
    case 'archwing':
      return { title: 'es. Itzal Rush Build', itemName: 'es. Itzal' };
    case 'necramech':
      return { title: 'es. Voidrig Tank Build', itemName: 'es. Voidrig' };
    case 'k_drive':
      return { title: 'es. K-Drive Standing Grinding', itemName: 'es. K-Drive Runway' };
    case 'railjack':
      return { title: 'es. Railjack Steel Path Solo', itemName: 'es. Railjack' };
    default:
      return { title: 'es. Titolo della build', itemName: 'es. Nome oggetto' };
  }
}
```

---

## `src/lib/markdown.ts`

```ts
/**
 * Vogliamo che ogni singolo Invio dell'utente produca un ritorno a capo visibile —
 * comprese le righe vuote multiple consecutive (es. 3 Invio di fila = 2 righe vuote
 * visibili, non una sola).
 *
 * Markdown però, per specifica, ignora sia gli a capo singoli (li tratta come uno
 * spazio) sia le righe vuote multiple consecutive (le comprime tutte in un unico
 * separatore di paragrafo). Per bypassare questo comportamento:
 *
 * 1. Normalizziamo tutti i tipi di ritorno a capo (Windows \r\n, vecchio Mac \r,
 *    Unix \n) in un unico \n.
 * 2. Dividiamo il testo riga per riga.
 * 3. Ogni riga VUOTA viene sostituita con uno spazio unificatore (\u00A0): questo
 *    perché Markdown considera "vuota" (e quindi la comprime) qualunque riga fatta
 *    di soli spazi normali o niente — ma NON una riga che contiene questo carattere
 *    speciale, che quindi sopravvive come riga a sé stante.
 * 4. Riuniamo tutte le righe con un hard break Markdown esplicito (due spazi + \n)
 *    tra l'una e l'altra, così ogni riga (vuota o no) genera un vero ritorno a capo
 *    visibile, nell'ordine e nella quantità esatta in cui l'utente li ha scritti.
 */
export function preserveLineBreaks(text: string | null | undefined): string {
  if (!text) return '';
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return normalized
    .split('\n')
    .map((line) => (line.trim() === '' ? '\u00A0' : line))
    .join('  \n');
}
```

---

## `src/lib/railjack.ts`

```ts
import type { RailjackCrewRole, RailjackData } from '@/lib/types';

export type RailjackComponentKey = 'shield_array' | 'engines' | 'plating' | 'reactor';
export type RailjackArmamentKey = 'pilota' | 'torrette' | 'ordnance';

/** Le 4 categorie di componenti del Railjack (nomi del gioco). */
export const RAILJACK_COMPONENT_LABELS: Record<RailjackComponentKey, string> = {
  shield_array: 'Shield Array',
  engines: 'Engines',
  plating: 'Plating',
  reactor: 'Reactor',
};

export const RAILJACK_COMPONENT_PLACEHOLDERS: Record<RailjackComponentKey, string> = {
  shield_array: 'es. Zetki Shield Array Mk III',
  engines: 'es. Vidar Engines Mk III',
  plating: 'es. Vidar Plating Mk III',
  reactor: 'es. Zetki Reactor Mk III',
};

/**
 * I 3 slot di artiglieria (Armaments): il primo è l'arma del pilota (Nose Turret),
 * il secondo le torrette dorsale/ventrale usate dall'equipaggio (Swivel Turrets),
 * il terzo l'arma alternativa del pilota (Ordnance).
 */
export const RAILJACK_ARMAMENT_LABELS: Record<RailjackArmamentKey, string> = {
  pilota: 'Arma del pilota (Nose Turret)',
  torrette: 'Torrette dorsale/ventrale (Swivel)',
  ordnance: 'Ordnance',
};

export const RAILJACK_ARMAMENT_PLACEHOLDERS: Record<RailjackArmamentKey, string> = {
  pilota: 'es. Lavan Talyn Mk III',
  torrette: 'es. Vidar Apoc Mk III',
  ordnance: 'es. Tycho Seeker Mk III',
};

/** Ruoli che si possono assegnare ai membri dell'equipaggio. */
export const RAILJACK_CREW_ROLE_LABELS: Record<RailjackCrewRole, string> = {
  pilota: 'Pilota',
  gunner: 'Gunner',
  ingegnere: 'Ingegnere',
  difensore: 'Difensore',
};

export const RAILJACK_MAX_CREW = 8;

const COMPONENT_KEYS = Object.keys(RAILJACK_COMPONENT_LABELS) as RailjackComponentKey[];
const ARMAMENT_KEYS = Object.keys(RAILJACK_ARMAMENT_LABELS) as RailjackArmamentKey[];

/**
 * Ripulisce i dati prima di salvarli: toglie spazi e campi vuoti.
 * Restituisce null se non c'è nessun dato (così sul database non resta un oggetto vuoto).
 */
export function cleanRailjackData(data: RailjackData | null | undefined): RailjackData | null {
  if (!data) return null;
  const trim = (v?: string) => (v ?? '').trim();

  const components: NonNullable<RailjackData['components']> = {};
  for (const key of COMPONENT_KEYS) {
    const v = trim(data.components?.[key]);
    if (v) components[key] = v;
  }

  const armaments: NonNullable<RailjackData['armaments']> = {};
  for (const key of ARMAMENT_KEYS) {
    const v = trim(data.armaments?.[key]);
    if (v) armaments[key] = v;
  }

  const crew = (data.crew ?? []).slice(0, RAILJACK_MAX_CREW).map((m) => {
    const member: NonNullable<RailjackData['crew']>[number] = { role: m.role };
    const name = trim(m.name);
    const note = trim(m.note);
    if (name) member.name = name;
    if (note) member.note = note;
    return member;
  });

  const result: RailjackData = {};
  if (Object.keys(components).length) result.components = components;
  if (Object.keys(armaments).length) result.armaments = armaments;
  if (crew.length) result.crew = crew;
  return Object.keys(result).length ? result : null;
}

export function hasRailjackData(data: RailjackData | null | undefined): boolean {
  return cleanRailjackData(data) !== null;
}
```

---

## `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

## `src/lib/supabase/server.ts`

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // chiamato da un Server Component: ignorabile se c'è il middleware a rinfrescare le sessioni
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // vedi sopra
          }
        },
      },
    }
  );
}
```

---

## `src/lib/types.ts`

```ts
export type UserRole = 'admin' | 'editor' | 'membro';
export type UserStatus = 'pending' | 'approvato' | 'rifiutato';
export type BuildStatus = 'bozza' | 'pubblicata';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  ordine: number;
}

export interface Tag {
  id: string;
  nome: string;
}

export interface BuildMod {
  id: string;
  build_id: string;
  mod_name: string;
  rank: number | null;
  slot: string | null;
  note: string | null;
  ordine: number;
}

export interface BuildModImage {
  id: string;
  build_id: string;
  image_url: string;
  caption: string | null;
  ordine: number;
}

export interface BuildStats {
  critica?: string;
  status?: string;
  danno?: string;
  sopravvivenza?: string;
  energia?: string;
  range?: string;
  durata?: string;
  forza?: string;
  efficienza?: string;
  [key: string]: string | undefined;
}

// ---------- Railjack: dati strutturati oltre alla configurazione mod (Plexus) ----------
export type RailjackCrewRole = 'pilota' | 'gunner' | 'ingegnere' | 'difensore';

export interface RailjackCrewMember {
  role: RailjackCrewRole;
  name?: string;
  note?: string;
}

export interface RailjackData {
  /** Le 4 categorie di componenti della nave */
  components?: { shield_array?: string; engines?: string; plating?: string; reactor?: string };
  /** I 3 slot di artiglieria: arma del pilota (Nose Turret), torrette di bordo (Swivel), Ordnance */
  armaments?: { pilota?: string; torrette?: string; ordnance?: string };
  crew?: RailjackCrewMember[];
}

export interface Build {
  id: string;
  title: string;
  category_id: string;
  item_name: string;
  image_url: string | null;
  author_id: string;
  status: BuildStatus;
  description_md: string;
  playstyle_md: string;
  forma: string | null;
  polarity: string | null;
  reattore: boolean;
  stile: string | null;
  aura: string | null;
  exilus: string | null;
  arcane: string | null;
  focus_school: string | null;
  archon_shards: string | null;
  mods_image_url: string | null;
  railjack: RailjackData | null;
  stats: BuildStats;
  views_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  // relazioni opzionali popolate in query
  category?: Category;
  author?: Profile;
  mods?: BuildMod[];
  mod_images?: BuildModImage[];
  tags?: Tag[];
  is_favorite?: boolean;
}

export interface Comment {
  id: string;
  build_id: string | null;
  loadout_id: string | null;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface BuildHistoryEntry {
  id: string;
  build_id: string;
  editor_id: string;
  changed_at: string;
  diff_summary: string | null;
  editor?: Profile;
}

export type WeaponSlot = 'primaria' | 'secondaria' | 'melee' | 'exalted';

export interface LoadoutWeapon {
  id: string;
  loadout_id: string;
  slot: WeaponSlot;
  build_id: string | null;
  item_name: string | null;
  ordine: number;
  build?: Build;
}

export interface Loadout {
  id: string;
  title: string;
  author_id: string;
  status: BuildStatus;
  image_url: string | null;
  notes_md: string;
  warframe_build_id: string | null;
  warframe_item_name: string | null;
  warframe_forma: string | null;
  warframe_polarity: string | null;
  warframe_aura: string | null;
  warframe_exilus: string | null;
  warframe_arcane: string | null;
  warframe_archon_shards: string | null;
  warframe_focus_school: string | null;
  companion_build_id: string | null;
  companion_item_name: string | null;
  companion_weapon_build_id: string | null;
  companion_weapon_item_name: string | null;
  saves_count: number;
  created_at: string;
  updated_at: string;
  // relazioni opzionali popolate in query
  author?: Profile;
  warframe_build?: Build;
  companion_build?: Build;
  companion_weapon_build?: Build;
  weapons?: LoadoutWeapon[];
  is_favorite?: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  warframe: 'Warframe',
  arma_primaria: 'Arma primaria',
  arma_secondaria: 'Arma secondaria',
  arma_melee: 'Arma melee',
  arma_exalted: 'Arma Exalted',
  companion: 'Companion',
  arma_companion: 'Arma del companion',
  archgun: 'Archgun',
  archmelee: 'Archmelee',
  archwing: 'Archwing',
  necramech: 'Necramech',
  k_drive: 'K-Drive',
  railjack: 'Railjack',
};
```

---

## `src/middleware.ts`

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = user ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```
