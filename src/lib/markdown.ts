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

