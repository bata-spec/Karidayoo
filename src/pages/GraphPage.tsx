import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listEntries } from '../db';
import type { Entry } from '../types';
import GraphCanvas from '../components/GraphCanvas';

export default function GraphPage() {
  const { t } = useTranslation();
  const { workId, entryId } = useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showUntagged, setShowUntagged] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [browseMode, setBrowseMode] = useState<'category' | 'tag'>('category');

  useEffect(() => {
    if (!workId) return;
    listEntries(workId).then(setEntries);
  }, [workId]);

  const categoryCounts = useMemo(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      const c = e.category || t('common.uncategorized');
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries, t]);

  const tagCounts = useMemo(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const untaggedCount = useMemo(() => entries?.filter((e) => e.tags.length === 0).length ?? 0, [entries]);

  function backToBrowse() {
    setCategory(null);
    setSelectedTag(null);
    setShowUntagged(false);
    setShowAll(false);
  }

  if (entries === null) return <p className="helper-text">{t('common.loading')}</p>;

  if (entryId) {
    return (
      <div>
        <div className="row" style={{ marginBottom: 10 }}>
          <a className="btn btn-ghost" href={`#/works/${workId}/graph`}>
            {t('graph.backToFullGraph')}
          </a>
        </div>
        <GraphCanvas entries={entries} centerEntryId={entryId} />
      </div>
    );
  }

  const browsing = category !== null || selectedTag !== null || showUntagged;
  const hasAnyGrouping = categoryCounts.length > 0 || tagCounts.length > 0;
  const showGraph = browsing || showAll || !hasAnyGrouping;

  if (!showGraph) {
    return (
      <div>
        <div className="tabs" style={{ marginBottom: 4 }}>
          <button
            type="button"
            className={browseMode === 'category' ? 'active' : ''}
            onClick={() => setBrowseMode('category')}
          >
            {t('entryList.browseByCategory')}
          </button>
          <button type="button" className={browseMode === 'tag' ? 'active' : ''} onClick={() => setBrowseMode('tag')}>
            {t('entryList.browseByTag')}
          </button>
        </div>

        <p className="helper-text" style={{ marginBottom: 10 }}>
          {t('graph.pickHint')}
        </p>

        {browseMode === 'category' ? (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {categoryCounts.map(([c, count]) => (
              <button key={c} type="button" className="chip" onClick={() => setCategory(c)}>
                {c} {t('common.countSuffix', { count })}
              </button>
            ))}
          </div>
        ) : (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {tagCounts.map(([tag, count]) => (
              <button key={tag} type="button" className="chip" onClick={() => setSelectedTag(tag)}>
                {tag} {t('common.countSuffix', { count })}
              </button>
            ))}
            {untaggedCount > 0 && (
              <button type="button" className="chip" onClick={() => setShowUntagged(true)}>
                {t('entryList.untagged', { count: untaggedCount })}
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>
            {t('common.showAll', { count: entries.length })}
          </button>
        </div>
      </div>
    );
  }

  const visibleEntries =
    !hasAnyGrouping || showAll
      ? entries
      : category !== null
        ? entries.filter((e) => (e.category || t('common.uncategorized')) === category)
        : showUntagged
          ? entries.filter((e) => e.tags.length === 0)
          : entries.filter((e) => e.tags.includes(selectedTag!));

  return (
    <div>
      {hasAnyGrouping && (
        <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={backToBrowse}>
            {t('common.backToList')}
          </button>
          {category && <span className="chip">{category}</span>}
          {selectedTag && <span className="chip">{selectedTag}</span>}
          {showUntagged && <span className="chip">{t('entryList.untaggedLabel')}</span>}
          {showAll && <span className="chip">{t('common.allChip')}</span>}
        </div>
      )}
      <GraphCanvas entries={visibleEntries} />
    </div>
  );
}
