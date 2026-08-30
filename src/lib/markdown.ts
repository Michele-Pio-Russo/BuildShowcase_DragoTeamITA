/**
 * Markdown distingue due casi che l'utente scrive nello stesso modo (premendo Invio):
 *
 * 1. Una RIGA VUOTA tra due blocchi di testo → Markdown la riconosce già come separatore
 *    di paragrafo, e mostra uno spazio visibile tra i due blocchi. Questo caso va
 *    lasciato intatto (\n\n), altrimenti si perde la spaziatura tra paragrafi.
 *
 * 2. Un A CAPO SINGOLO (nessuna riga vuota in mezzo) → per specifica, Markdown lo
 *    ignora e lo tratta come uno spazio, unendo le due righe in una sola. Questo caso
 *    va trasformato in un hard break esplicito (due spazi + newline) per far sì che
 *    l'a capo dell'utente venga effettivamente rispettato, senza però aggiungere lo
 *    spazio extra di un nuovo paragrafo.
 *
 * Prima normalizziamo tutti i tipi di ritorno a capo (Windows \r\n, vecchio Mac \r,
 * Unix \n) in un unico \n, poi dividiamo il testo nei blocchi già separati da riga
 * vuota, e solo AGLI a capo singoli dentro ciascun blocco applichiamo l'hard break.
 */
export function preserveLineBreaks(text: string | null | undefined): string {
  if (!text) return '';
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return normalized
    .split(/\n{2,}/) // separa i paragrafi già separati da una riga vuota
    .map((paragraph) => paragraph.replace(/\n/g, '  \n')) // a capo singoli → hard break
    .join('\n\n'); // riunisce i paragrafi lasciando la riga vuota intatta tra loro
}
