/**
 * Markdown ignora gli "a capo singoli" per specifica (li tratta come spazio) e
 * spezza il testo in un nuovo paragrafo solo con una riga vuota. Per far sì che
 * ogni invio dell'utente diventi visivamente un ritorno a capo, trasformiamo ogni
 * singolo "\n" in un hard break Markdown (due spazi + newline), lasciando intatti
 * i paragrafi già separati da riga vuota.
 *
 * Normalizziamo prima tutti i tipi di ritorno a capo (Windows \r\n, vecchio Mac \r,
 * Unix \n) in un unico \n: senza questo passaggio, un \r\n residuo (comune quando
 * si scrive da Windows) può interferire con il riconoscimento dell'hard break da
 * parte del parser Markdown, facendo sembrare che l'a capo "non conti".
 */
export function preserveLineBreaks(text: string | null | undefined): string {
  if (!text) return '';
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.replace(/\n/g, '  \n');
}
