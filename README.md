# Clan Build Archive — Warframe

A private, role-based web app for collecting, organizing and sharing
Warframe builds (frames, weapons, companions) inside a gaming clan.
Built for the Drago Team ITA community.

**Live demo:** <link Vercel>  
**Italian version:** [README.it.md](README.it.md)

![Screenshot](docs/screenshot-home.png)

## Why it exists
Clan members kept sharing builds through chat messages that were
impossible to search and quickly got buried. This app gives the
community one searchable archive, with moderation and access control.

## Features
- Approval-based access: new accounts stay "pending" until an admin approves them
- Three roles (Admin, Editor, Member) with different permissions
- Create, edit and publish builds; image upload via Supabase Storage
- Search, favorites and comments on builds
- Tag system for builds (tag filtering: see Roadmap)
- View counter on each build
- Admin panel to manage users and roles

## Tech stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Security:** Row Level Security policies enforced at database level,
  so permissions hold even if the API is called directly
- **Deployment:** Vercel

## Architecture
Browser → Next.js on Vercel → Supabase (Auth / Postgres with RLS / Storage)

## Roles
| Role   | Permissions                                              |
|--------|----------------------------------------------------------|
| Admin  | Manage users, roles, builds and comments                 |
| Editor | Create, edit, publish builds; upload images; manage tags |
| Member | View, search, favorite, comment                          |

## Getting started
1. `npm install`
2. Create a free project on supabase.com and copy the Project URL and anon key
3. `cp .env.local.example .env.local` and fill in the values
4. Run the SQL migrations in `supabase/migrations/` (SQL Editor, or `supabase db push`)
5. `npm run dev` → http://localhost:3000

### Creating the first admin
1. Register an account at `/register` (it starts as role `membro`, status `pending`)
2. In the Supabase dashboard open **Table Editor → profiles** and set
   `role = admin` and `status = approvato` on your row
3. From then on you can approve other users from **Administration → Users**

## Deployment
Push to GitHub, import the repo on Vercel and add the two
`NEXT_PUBLIC_SUPABASE_*` environment variables.

## Roadmap
- Server-side tag filtering (join with `build_tags`)
- Unique view counting (currently incremented on every open)
- Optional private image bucket with signed URLs
- `views_count` viene incrementato ad ogni apertura della scheda build; se vuoi contare solo visualizzazioni uniche andrà aggiunta una tabella di tracciamento.
