import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listEntries } from '../db';
import type { Entry } from '../types';
import GraphCanvas from '../components/GraphCanvas';

export default function GraphPage() {
  const { workId, entryId } = useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showUntagged, setShowUntagged] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!workId) return;
    listEntries(workId).then(setEntries);
  }, [workId]);

  const tagCounts = useMemo(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));
  }, [entries]);

  const untaggedCount = useMemo(() => entries?.filter((e) => e.tags.length === 0).length ?? 0, [entries]);

  function backToTags() {
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

  const browsingByTag = selectedTag !== null || showUntagged;
  const showGraph = browsingByTag || showAll || tagCounts.length === 0;

  if (!showGraph) {
    return (
      <div>
        <p className="helper-text" style={{ marginBottom: 10 }}>
          タグを選ぶと、そのタグが付いたエントリだけでグラフを表示します。
        </p>
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
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>
            すべて表示({entries.length}件)
          </button>
        </div>
      </div>
    );
  }

  const visibleEntries =
    tagCounts.length === 0 || showAll
      ? entries
      : showUntagged
        ? entries.filter((e) => e.tags.length === 0)
        : entries.filter((e) => e.tags.includes(selectedTag!));

  return (
    <div>
      {tagCounts.length > 0 && (
        <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={backToTags}>
            ← タグ一覧に戻る
          </button>
          {selectedTag && <span className="chip">{selectedTag}</span>}
          {showUntagged && <span className="chip">タグなし</span>}
          {showAll && <span className="chip">すべて</span>}
        </div>
      )}
      <GraphCanvas entries={visibleEntries} />
    </div>
  );
}
