import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listEntries } from '../db';
import type { Entry } from '../types';

export default function EntryListPage() {
  const { workId } = useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showUntagged, setShowUntagged] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!workId) return;
    listEntries(workId).then(setEntries);
  }, [workId]);

  const categories = useMemo(() => {
    if (!entries) return [];
    return Array.from(new Set(entries.map((e) => e.category).filter(Boolean)));
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

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (selectedTag && !e.tags.includes(selectedTag)) return false;
      if (showUntagged && e.tags.length > 0) return false;
      if (!search.trim()) return true;
      const q = search.trim();
      return e.title.includes(q) || e.body.includes(q) || e.tags.some((t) => t.includes(q));
    });
  }, [entries, search, category, selectedTag, showUntagged]);

  const browsingByTag = selectedTag !== null || showUntagged;
  const showList = search.trim() !== '' || browsingByTag || showAll || tagCounts.length === 0;

  function backToTags() {
    setSelectedTag(null);
    setShowUntagged(false);
    setShowAll(false);
    setSearch('');
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          type="search"
          placeholder="タイトル・本文・タグで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {showList && (
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">すべてのカテゴリ</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>
      <div style={{ marginBottom: 14 }}>
        <a href={`#/works/${workId}/entries/new`} className="btn btn-primary">
          ＋ 新規エントリ
        </a>
      </div>

      {entries === null ? (
        <p className="helper-text">読み込み中...</p>
      ) : !showList ? (
        <div>
          <p className="helper-text" style={{ marginBottom: 10 }}>
            タグを選ぶと、そのタグが付いたエントリだけ表示されます。
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
      ) : (
        <div>
          {(browsingByTag || showAll) && tagCounts.length > 0 && (
            <div className="row" style={{ marginBottom: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={backToTags}>
                ← タグ一覧に戻る
              </button>
              {selectedTag && <span className="chip">{selectedTag}</span>}
              {showUntagged && <span className="chip">タグなし</span>}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>{entries.length === 0 ? 'まだエントリがありません。' : '条件に一致するエントリがありません。'}</p>
            </div>
          ) : (
            <div className="card-list">
              {filtered.map((entry) => {
                const main = entry.images.find((img) => img.isMain) ?? entry.images[0];
                return (
                  <a key={entry.id} className="entry-row" href={`#/works/${workId}/entries/${entry.id}`}>
                    {main && <img className="thumb" src={main.dataUrl} alt="" />}
                    <div>
                      <div className="entry-row-title">{entry.title || '(無題)'}</div>
                      <div className="entry-row-meta">
                        {entry.category || '未分類'}
                        {entry.tags.length > 0 && ` · ${entry.tags.join(', ')}`}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
