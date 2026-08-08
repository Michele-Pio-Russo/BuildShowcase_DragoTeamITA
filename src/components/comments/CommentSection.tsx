'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Comment } from '@/lib/types';

export default function CommentSection({ buildId }: { buildId: string }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*)')
      .eq('build_id', buildId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, [buildId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !currentUserId) return;
    setPosting(true);
    await supabase.from('comments').insert({
      build_id: buildId,
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
