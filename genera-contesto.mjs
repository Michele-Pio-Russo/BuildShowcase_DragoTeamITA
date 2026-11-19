#!/usr/bin/env node
/**
 * Genera UN file Markdown con il codice del progetto, da caricare nella conoscenza del Progetto Claude.
 *
 * Uso (dalla cartella principale del progetto, quella con package.json):
 *   node genera-contesto.mjs                      -> crea 02_codice_sito.md
 *   node genera-contesto.mjs 02_codice_app.md     -> crea il file con un altro nome
 *
 * Legge solo: src/, app/, components/, lib/, supabase/ (codice, CSS, SQL) e alcuni file di
 * configurazione nella radice. Non legge mai .env, node_modules, .next, .git.
 * Se trova qualcosa che somiglia a una chiave segreta, la oscura e te lo segnala.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = process.argv[2] ?? '02_codice_sito.md';
const OUT_PATH = resolve(ROOT, OUT);   // funziona sia con un nome semplice sia con un percorso completo

const SCAN_DIRS = ['supabase', 'src', 'app', 'components', 'lib'];
const ROOT_FILES = [
  'package.json', 'tsconfig.json', 'tailwind.config.ts', 'tailwind.config.js',
  'next.config.js', 'next.config.mjs', 'app.json', 'app.config.ts', 'app.config.js',
  'eas.json', 'babel.config.js', 'metro.config.js',
];
// Attenzione: NON ignorare 'build', 'dist' o 'out': nel sito 'build' è una cartella di codice vera.
const IGNORE_DIRS = new Set(['node_modules', '.next', '.expo', '.git', '.vercel', '.turbo']);
const LANG = { '.ts': 'ts', '.tsx': 'tsx', '.js': 'js', '.jsx': 'jsx', '.mjs': 'js', '.css': 'css', '.sql': 'sql', '.json': 'json' };
const MAX_BYTES = 300 * 1024;

// Chiavi che non devono mai finire nel file: i token JWT (anon/service key) vengono oscurati.
const JWT_RE = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.?[A-Za-z0-9_-]*/g;
const WARN_RE = /service_role|SUPABASE_SERVICE/i;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir).sort()) {
    if (IGNORE_DIRS.has(name) || name.startsWith('.env')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.endsWith('.d.ts')) continue;
    else if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.sql'].includes(extname(name)) && st.size <= MAX_BYTES) acc.push(full);
  }
  return acc;
}

const files = [];
for (const f of ROOT_FILES) if (existsSync(join(ROOT, f))) files.push(join(ROOT, f));
for (const d of SCAN_DIRS) if (existsSync(join(ROOT, d))) walk(join(ROOT, d), files);

const warnings = [];
const parts = [];
for (const full of files) {
  const rel = relative(ROOT, full).split('\\').join('/');
  let content = readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
  if (JWT_RE.test(content)) {
    JWT_RE.lastIndex = 0;
    content = content.replace(JWT_RE, '[CHIAVE OSCURATA]');
    warnings.push(`${rel}: token oscurato`);
  }
  JWT_RE.lastIndex = 0;
  if (WARN_RE.test(content)) warnings.push(`${rel}: contiene "service_role" (controlla che non sia una chiave vera)`);

  let fence = '```';
  while (content.includes(fence)) fence += '`';
  parts.push(`\n---\n\n## \`${rel}\`\n\n${fence}${LANG[extname(rel)] ?? ''}\n${content.replace(/\n+$/, '')}\n${fence}\n`);
}

const header =
  `# Codice sorgente del progetto\n\n` +
  `Generato il ${new Date().toISOString().slice(0, 10)} con genera-contesto.mjs — ${files.length} file.\n` +
  `Ogni file è introdotto da un titolo "## \`percorso\`" seguito da un blocco di codice: ` +
  `si può ricostruire la cartella del progetto spezzando il testo su quei titoli.\n`;

writeFileSync(OUT_PATH, header + parts.join(''), 'utf8');

const kb = Math.round(statSync(OUT_PATH).size / 1024);
console.log(`Creato ${OUT}: ${files.length} file, ${kb} KB.`);
if (warnings.length) {
  console.log('\nATTENZIONE:');
  for (const w of warnings) console.log(' - ' + w);
}
