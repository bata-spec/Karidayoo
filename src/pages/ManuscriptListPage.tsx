import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  createManuscriptChapter,
  deleteManuscriptChapter,
  getWork,
  listManuscriptChapters,
  reorderManuscriptChapters,
} from '../db';
import type { ManuscriptChapter, Work } from '../types';

export default function ManuscriptListPage() {
  const { t, i18n } = useTranslation();
  const { workId } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<ManuscriptChapter[] | null>(null);
  const [title, setTitle] = useState('');

  const refresh = useCallback(async () => {
    if (!workId) return;
    const [w, list] = await Promise.all([getWork(workId), listManuscriptChapters(workId)]);
    setWork(w ?? null);
    setChapters(list);
  }, [workId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workId || !title.trim()) return;
    const chapter = await createManuscriptChapter(workId, title.trim());
    setTitle('');
    navigate(`/works/${workId}/manuscript/${chapter.id}`);
  }

  async function handleDelete(id: string) {
    if (!confirm(t('manuscript.deleteConfirm'))) return;
    await deleteManuscriptChapter(id);
    refresh();
  }

  async function moveChapter(index: number, direction: -1 | 1) {
    if (!chapters) return;
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    const next = [...chapters];
    [next[index], next[target]] = [next[target], next[index]];
    setChapters(next);
    await reorderManuscriptChapters(next);
  }

  const totalChars = chapters?.reduce((sum, c) => sum + c.body.length, 0) ?? 0;
  const target = work?.targetWordCount;
  const progress = target && target > 0 ? Math.min(100, Math.round((totalChars / target) * 100)) : null;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        {target ? (
          <p style={{ margin: 0 }}>
            {t('manuscript.totalWithTarget', {
              total: totalChars.toLocaleString(i18n.language),
              target: target.toLocaleString(i18n.language),
              percent: progress,
            })}
          </p>
        ) : (
          <p style={{ margin: 0 }}>{t('manuscript.totalOnly', { total: totalChars.toLocaleString(i18n.language) })}</p>
        )}
      </div>

      <form onSubmit={handleCreate} className="row" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t('manuscript.newChapterPlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
          {t('manuscript.createChapter')}
        </button>
      </form>

      {chapters === null ? (
        <p className="helper-text">{t('common.loading')}</p>
      ) : chapters.length === 0 ? (
        <div className="empty-state">
          <p>{t('manuscript.noChapters')}</p>
        </div>
      ) : (
        <div className="card-list">
          {chapters.map((chapter, i) => (
            <div key={chapter.id} className="entry-row">
              <a
                href={`#/works/${workId}/manuscript/${chapter.id}`}
                style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}
              >
                <div className="entry-row-title">{chapter.title || t('common.untitled')}</div>
                <div className="entry-row-meta">
                  {t('manuscript.charCount', { count: chapter.body.length.toLocaleString(i18n.language) })}
                </div>
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => moveChapter(i, -1)} disabled={i === 0} aria-label={t('common.moveUp')}>
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => moveChapter(i, 1)}
                disabled={i === chapters.length - 1}
                aria-label={t('common.moveDown')}
              >
                ↓
              </button>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(chapter.id)}>
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
