/**
 * Markdown ignora gli "a capo singoli" per specifica (li tratta come spazio) e
 * spezza il testo in un nuovo paragrafo solo con una riga vuota. Per far sì che
 * ogni invio dell'utente diventi visivamente un ritorno a capo, trasformiamo ogni
 * singolo "\n" in un hard break Markdown (due spazi + newline), lasciando intatti
 * i paragrafi già separati da riga vuota.
 */
export function preserveLineBreaks(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\n/g, '  \n');
}
