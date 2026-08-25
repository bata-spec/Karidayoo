import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Entry, Relation } from '../types';

interface Props {
  relations: Relation[];
  onChange: (relations: Relation[]) => void;
  allEntries: Entry[];
  currentEntryId?: string;
}

export default function RelationsEditor({ relations, onChange, allEntries, currentEntryId }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const entryById = useMemo(() => new Map(allEntries.map((e) => [e.id, e])), [allEntries]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim();
    const usedIds = new Set(relations.map((r) => r.targetId));
    return allEntries
      .filter((e) => e.id !== currentEntryId && !usedIds.has(e.id) && e.title.includes(q))
      .slice(0, 8);
  }, [allEntries, query, currentEntryId, relations]);

  function addRelation(targetId: string) {
    onChange([...relations, { targetId, label: '' }]);
    setQuery('');
  }

  function updateLabel(index: number, label: string) {
    onChange(relations.map((r, i) => (i === index ? { ...r, label } : r)));
  }

  function removeRelation(index: number) {
    onChange(relations.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="row-list">
        {relations.map((rel, index) => {
          const target = entryById.get(rel.targetId);
          return (
            <div className="row" key={rel.targetId}>
              <span className="chip" style={{ flexShrink: 0 }}>
                {target ? target.title : t('common.deletedEntry')}
              </span>
              <input
                type="text"
                placeholder={t('relations.labelPlaceholder')}
                value={rel.label}
                onChange={(e) => updateLabel(index, e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => removeRelation(index)} aria-label={t('relations.removeAria')}>
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <div className="field" style={{ marginBottom: 4 }}>
        <input
          type="search"
          placeholder={t('relations.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <div className="card row-list" style={{ marginBottom: 10 }}>
          {results.map((e) => (
            <button
              key={e.id}
              type="button"
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => addRelation(e.id)}
            >
              {e.title} <span className="helper-text">({e.category})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
