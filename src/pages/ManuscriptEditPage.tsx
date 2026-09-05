import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getManuscriptChapter, saveManuscriptChapter } from '../db';
import type { ManuscriptChapter } from '../types';

export default function ManuscriptEditPage() {
  const { t, i18n } = useTranslation();
  const { workId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ManuscriptChapter | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!chapterId) return;
    getManuscriptChapter(chapterId).then((c) => {
      setChapter(c ?? null);
      if (c) {
        setTitle(c.title);
        setBody(c.body);
      }
    });
  }, [chapterId]);

  async function handleSave() {
    if (!chapter) return;
    const updated: ManuscriptChapter = { ...chapter, title: title.trim() || t('common.untitled'), body };
    await saveManuscriptChapter(updated);
    navigate(`/works/${workId}/manuscript`);
  }

  if (chapter === undefined) return <p className="helper-text">{t('common.loading')}</p>;
  if (chapter === null) return <p>{t('manuscript.notFound')}</p>;

  return (
    <div>
      <div className="top-bar">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('common.untitled')}
          style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1, marginRight: 12 }}
        />
        <div className="row">
          <button type="button" className="btn" onClick={() => navigate(`/works/${workId}/manuscript`)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>

      <p className="helper-text" style={{ marginBottom: 8 }}>
        {t('manuscript.charCount', { count: body.length.toLocaleString(i18n.language) })}
      </p>

      <textarea
        className="plain-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('manuscript.bodyPlaceholder')}
        style={{ minHeight: '60vh' }}
      />
    </div>
  );
}
