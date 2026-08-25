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

  const categories = useMemo(() => categoryCounts.map(([c]) => c), [categoryCounts]);

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
      if (category && (e.category || '未分類') !== category) return false;
      if (selectedTag && !e.tags.includes(selectedTag)) return false;
      if (showUntagged && e.tags.length > 0) return false;
      if (!search.trim()) return true;
      const q = search.trim();
      return e.title.includes(q) || e.body.includes(q) || e.tags.some((t) => t.includes(q));
    });
  }, [entries, search, category, selectedTag, showUntagged]);

  const browsingByCategory = category !== '';
  const browsingByTag = selectedTag !== null || showUntagged;
  const hasAnyGrouping = categoryCounts.length > 0 || tagCounts.length > 0;
  const showList = search.trim() !== '' || browsingByCategory || browsingByTag || showAll || !hasAnyGrouping;

  function backToBrowse() {
    setCategory('');
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
      ) : (
        <div>
          {(browsingByCategory || browsingByTag || showAll) && hasAnyGrouping && (
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
