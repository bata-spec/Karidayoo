import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTimeline, saveTimeline } from '../db';
import type { Timeline, TimelineEvent } from '../types';
import { newId } from '../utils/id';

export default function TimelineEditPage() {
  const { t } = useTranslation();
  const { workId, timelineId } = useParams();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<Timeline | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!timelineId) return;
    getTimeline(timelineId).then((tl) => {
      setTimeline(tl ?? null);
      if (tl) {
        setName(tl.name);
        setEvents(tl.events);
      }
    });
  }, [timelineId]);

  function updateEvent(index: number, field: 'time' | 'body', value: string) {
    setEvents(events.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev)));
  }

  function addEvent() {
    setEvents([...events, { id: newId('event'), time: '', body: '' }]);
  }

  function removeEvent(index: number) {
    setEvents(events.filter((_, i) => i !== index));
  }

  function moveEvent(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= events.length) return;
    const next = [...events];
    [next[index], next[target]] = [next[target], next[index]];
    setEvents(next);
  }

  async function handleSave() {
    if (!timeline) return;
    const updated: Timeline = { ...timeline, name: name.trim() || timeline.name, events };
    await saveTimeline(updated);
    navigate(`/works/${workId}/timelines`);
  }

  if (timeline === undefined) return <p className="helper-text">{t('common.loading')}</p>;
  if (timeline === null) return <p>{t('timeline.notFound')}</p>;

  return (
    <div>
      <div className="top-bar">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1, marginRight: 12 }}
        />
        <div className="row">
          <button type="button" className="btn" onClick={() => navigate(`/works/${workId}/timelines`)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="card-list" style={{ marginBottom: 16 }}>
        {events.map((ev, i) => (
          <div className="card" key={ev.id}>
            <div className="row" style={{ marginBottom: 8 }}>
              <input
                type="text"
                value={ev.time}
                onChange={(e) => updateEvent(i, 'time', e.target.value)}
                placeholder={t('timeline.eventTimePlaceholder')}
                style={{ flex: 1, fontWeight: 600 }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => moveEvent(i, -1)} disabled={i === 0} aria-label={t('common.moveUp')}>
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => moveEvent(i, 1)}
                disabled={i === events.length - 1}
                aria-label={t('common.moveDown')}
              >
                ↓
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => removeEvent(i)}>
                ✕
              </button>
            </div>
            <textarea
              className="plain-textarea"
              value={ev.body}
              onChange={(e) => updateEvent(i, 'body', e.target.value)}
              placeholder={t('timeline.eventBodyPlaceholder')}
              style={{ minHeight: 80 }}
            />
          </div>
        ))}
      </div>

      <button type="button" className="btn" onClick={addEvent}>
        {t('timeline.addEvent')}
      </button>
    </div>
  );
}
