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
