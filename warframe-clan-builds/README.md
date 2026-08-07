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
- `views_count` viene incrementato ad ogni apertura della scheda build; se vuoi contare solo visualizzazioni uniche andrà aggiunta una tabella di tracciamento.
