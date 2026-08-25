import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listEntries } from '../db';
import type { Entry } from '../types';
import GraphCanvas from '../components/GraphCanvas';

export default function GraphPage() {
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
      const c = e.category || '未分類';
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));
  }, [entries]);

  const tagCounts = useMemo(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));
  }, [entries]);

  const untaggedCount = useMemo(() => entries?.filter((e) => e.tags.length === 0).length ?? 0, [entries]);

  function backToBrowse() {
    setCategory(null);
    setSelectedTag(null);
    setShowUntagged(false);
    setShowAll(false);
  }

  if (entries === null) return <p className="helper-text">読み込み中...</p>;

  if (entryId) {
    return (
      <div>
        <div className="row" style={{ marginBottom: 10 }}>
          <a className="btn btn-ghost" href={`#/works/${workId}/graph`}>
            ← 全体グラフに戻る
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
            カテゴリで見る
          </button>
          <button type="button" className={browseMode === 'tag' ? 'active' : ''} onClick={() => setBrowseMode('tag')}>
            タグで見る
          </button>
        </div>

        <p className="helper-text" style={{ marginBottom: 10 }}>
          選ぶと、そのカテゴリ/タグのエントリだけでグラフを表示します。
        </p>

        {browseMode === 'category' ? (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {categoryCounts.map(([c, count]) => (
              <button key={c} type="button" className="chip" onClick={() => setCategory(c)}>
                {c} ({count})
              </button>
            ))}
          </div>
        ) : (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {tagCounts.map(([tag, count]) => (
              <button key={tag} type="button" className="chip" onClick={() => setSelectedTag(tag)}>
                {tag} ({count})
              </button>
            ))}
            {untaggedCount > 0 && (
              <button type="button" className="chip" onClick={() => setShowUntagged(true)}>
                タグなし ({untaggedCount})
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>
            すべて表示({entries.length}件)
          </button>
        </div>
      </div>
    );
  }

  const visibleEntries = !hasAnyGrouping || showAll
    ? entries
    : category !== null
      ? entries.filter((e) => (e.category || '未分類') === category)
      : showUntagged
        ? entries.filter((e) => e.tags.length === 0)
        : entries.filter((e) => e.tags.includes(selectedTag!));

  return (
    <div>
      {hasAnyGrouping && (
        <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={backToBrowse}>
            ← 一覧に戻る
          </button>
          {category && <span className="chip">{category}</span>}
          {selectedTag && <span className="chip">{selectedTag}</span>}
          {showUntagged && <span className="chip">タグなし</span>}
          {showAll && <span className="chip">すべて</span>}
        </div>
      )}
      <GraphCanvas entries={visibleEntries} />
    </div>
  );
}
