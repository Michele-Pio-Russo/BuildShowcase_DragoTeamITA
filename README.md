# Archivio Build del Clan — Warframe

Web app privata per raccogliere, organizzare e condividere build di Warframe, armi e companion. Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.

## 1. Installazione delle dipendenze

```bash
npm install
```

## 2. Creazione del progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto (gratuito).
2. Annota **Project URL** e **anon public key** da *Project Settings → API*.

## 3. Configurazione delle variabili d'ambiente

Copia il file d'esempio e compilalo con i tuoi valori:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 4. Esecuzione delle migrazioni SQL

Nel dashboard Supabase apri **SQL Editor** ed esegui, in ordine, il contenuto dei due file:

1. `supabase/migrations/0001_init.sql` — tabelle, ruoli, RLS, trigger.
2. `supabase/migrations/0002_storage.sql` — bucket immagini e relative policy.

In alternativa, se usi la Supabase CLI:

```bash
supabase link --project-ref <tuo-project-ref>
supabase db push
```

## 5. Creazione del primo account Admin

1. Avvia l'app (vedi punto 6) e vai su `/register` per creare il tuo account: verrà creato con ruolo `membro` e stato `pending`.
2. Nel dashboard Supabase apri **Table Editor → profiles**, trova la riga con il tuo `username` e imposta manualmente:
   - `role` → `admin`
   - `status` → `approvato`
3. Da questo momento potrai accedere all'app come Admin e approvare gli altri membri del clan dalla sezione **Amministrazione → Utenti**, senza dover più toccare il database a mano.

## 6. Avvio locale

```bash
npm run dev
```

L'app sarà disponibile su [http://localhost:3000](http://localhost:3000).

## 7. Deploy su Vercel

1. Carica il progetto su un repository GitHub/GitLab.
2. Su [vercel.com](https://vercel.com) importa il repository.
3. Aggiungi le variabili d'ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` in *Project Settings → Environment Variables*.
4. Deploy. Nessuna configurazione aggiuntiva richiesta (Next.js è supportato nativamente).

## Struttura ruoli

| Ruolo | Permessi |
|---|---|
| **Admin** | Tutto: gestione utenti, ruoli, build e commenti di chiunque |
| **Editor** | Crea, modifica, pubblica build; carica immagini; gestisce tag |
| **Membro** | Visualizza, cerca, filtra, salva preferiti, commenta |

Tutti i permessi sono applicati tramite **Row Level Security** su Postgres (vedi `0001_init.sql`), non solo nell'interfaccia: anche chiamando direttamente le API di Supabase, un Membro non potrà mai creare o modificare una build.

## Note e possibili estensioni future

- Il filtro per tag nell'elenco build è predisposto ma semplificato nell'MVP (mostra tutte le build; il filtro effettivo richiede un join lato server con `build_tags`, facile da aggiungere).
- Per invitare i membri del clan puoi condividere il link a `/register`; resteranno in stato "in attesa" finché non li approvi da **Admin → Utenti**.
- Le immagini sono salvate nel bucket pubblico `build-images` (adatto a un clan privato con URL non indicizzati); se preferisci privacy totale, il bucket può essere reso privato con URL firmati.


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
