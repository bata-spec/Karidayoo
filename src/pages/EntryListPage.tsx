import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listEntries } from '../db';
import type { Entry } from '../types';

export default function EntryListPage() {
  const { workId } = useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!workId) return;
    listEntries(workId).then(setEntries);
  }, [workId]);

  const categories = useMemo(() => {
    if (!entries) return [];
    return Array.from(new Set(entries.map((e) => e.category).filter(Boolean)));
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (!search.trim()) return true;
      const q = search.trim();
      return (
        e.title.includes(q) ||
        e.body.includes(q) ||
        e.tags.some((t) => t.includes(q))
      );
    });
  }, [entries, search, category]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <input
          type="search"
          placeholder="タイトル・本文・タグで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <a href={`#/works/${workId}/entries/new`} className="btn btn-primary">
          ＋ 新規エントリ
        </a>
      </div>

      {entries === null ? (
        <p className="helper-text">読み込み中...</p>
      ) : filtered.length === 0 ? (
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
  );
}
