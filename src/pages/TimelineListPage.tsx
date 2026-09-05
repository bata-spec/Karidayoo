import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createTimeline, deleteTimeline, listTimelines } from '../db';
import type { Timeline } from '../types';

export default function TimelineListPage() {
  const { t } = useTranslation();
  const { workId } = useParams();
  const [timelines, setTimelines] = useState<Timeline[] | null>(null);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => {
    if (!workId) return;
    setTimelines(await listTimelines(workId));
  }, [workId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workId || !name.trim()) return;
    await createTimeline(workId, name.trim());
    setName('');
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('timeline.deleteConfirm'))) return;
    await deleteTimeline(id);
    refresh();
  }

  return (
    <div>
      <p className="helper-text" style={{ marginBottom: 16 }}>
        {t('timeline.helper')}
      </p>

      <form onSubmit={handleCreate} className="row" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t('timeline.newTimelinePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          {t('timeline.createTimeline')}
        </button>
      </form>

      {timelines === null ? (
        <p className="helper-text">{t('common.loading')}</p>
      ) : timelines.length === 0 ? (
        <div className="empty-state">
          <p>{t('timeline.noTimelines')}</p>
        </div>
      ) : (
        <div className="card-list">
          {timelines.map((timeline) => (
            <div key={timeline.id} className="entry-row">
              <a
                href={`#/works/${workId}/timelines/${timeline.id}`}
                style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}
              >
                <div className="entry-row-title">{timeline.name}</div>
                <div className="entry-row-meta">{t('timeline.eventCount', { count: timeline.events.length })}</div>
              </a>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(timeline.id)}>
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
