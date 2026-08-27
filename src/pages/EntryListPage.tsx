import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listEntries } from '../db';
import type { Entry } from '../types';
import { buildCategoryTree, findCategoryNode } from '../utils/categoryTree';

export default function EntryListPage() {
  const { t } = useTranslation();
  const { workId } = useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showUntagged, setShowUntagged] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [browseMode, setBrowseMode] = useState<'category' | 'tag'>('category');
  const [categoryPath, setCategoryPath] = useState<string[]>([]);

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

  const categories = useMemo(() => categoryCounts.map(([c]) => c), [categoryCounts]);
  const categoryTree = useMemo(() => buildCategoryTree(categoryCounts), [categoryCounts]);

  const tagCounts = useMemo(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const untaggedCount = useMemo(() => entries?.filter((e) => e.tags.length === 0).length ?? 0, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      if (category && (e.category || t('common.uncategorized')) !== category) return false;
      if (selectedTag && !e.tags.includes(selectedTag)) return false;
      if (showUntagged && e.tags.length > 0) return false;
      if (!search.trim()) return true;
      const q = search.trim();
      return e.title.includes(q) || e.body.includes(q) || e.tags.some((tag) => tag.includes(q));
    });
  }, [entries, search, category, selectedTag, showUntagged, t]);

  const browsingByCategory = category !== '';
  const browsingByTag = selectedTag !== null || showUntagged;
  const hasAnyGrouping = categoryCounts.length > 0 || tagCounts.length > 0;
  const showList = search.trim() !== '' || browsingByCategory || browsingByTag || showAll || !hasAnyGrouping;

  function backToBrowse() {
    setCategory('');
    setCategoryPath([]);
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
          placeholder={t('entryList.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {showList && (
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('entryList.allCategories')}</option>
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
          {t('entryList.newEntry')}
        </a>
      </div>

      {entries === null ? (
        <p className="helper-text">{t('common.loading')}</p>
      ) : !showList ? (
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

          {browseMode === 'category' ? (
            <div>
              {categoryPath.length > 0 && (
                <div className="row" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setCategoryPath([])}>
                    {t('common.backToList')}
                  </button>
                  {categoryPath.map((segment, i) => (
                    <button
                      key={i}
                      type="button"
                      className="chip"
                      onClick={() => setCategoryPath(categoryPath.slice(0, i + 1))}
                    >
                      {segment}
                    </button>
                  ))}
                </div>
              )}
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {(categoryPath.length === 0 ? categoryTree : (findCategoryNode(categoryTree, categoryPath)?.children ?? [])).map(
                  (node) => (
                    <button
                      key={node.segment}
                      type="button"
                      className="chip"
                      onClick={() => (node.children.length === 0 ? setCategory(node.path.join('/')) : setCategoryPath(node.path))}
                    >
                      {node.children.length === 0 ? '' : '📁 '}
                      {node.segment} {t('common.countSuffix', { count: node.totalCount })}
                    </button>
                  ),
                )}
              </div>
              {categoryPath.length > 0 &&
                (() => {
                  const node = findCategoryNode(categoryTree, categoryPath);
                  return node && node.directCount > 0 ? (
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="btn" onClick={() => setCategory(node.path.join('/'))}>
                        {t('entryList.showCategoryEntries', { count: node.directCount })}
                      </button>
                    </div>
                  ) : null;
                })()}
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
      ) : (
        <div>
          {(browsingByCategory || browsingByTag || showAll) && hasAnyGrouping && (
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

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>{entries.length === 0 ? t('entryList.noEntries') : t('entryList.noMatch')}</p>
            </div>
          ) : (
            <div className="card-list">
              {filtered.map((entry) => {
                const main = entry.images.find((img) => img.isMain) ?? entry.images[0];
                return (
                  <a key={entry.id} className="entry-row" href={`#/works/${workId}/entries/${entry.id}`}>
                    {main && <img className="thumb" src={main.dataUrl} alt="" />}
                    <div>
                      <div className="entry-row-title">{entry.title || t('common.untitled')}</div>
                      <div className="entry-row-meta">
                        {entry.category || t('common.uncategorized')}
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
