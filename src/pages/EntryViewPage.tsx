import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteEntry, getEntry, listEntries } from '../db';
import type { Entry } from '../types';
import WikiLinkText from '../components/WikiLinkText';

export default function EntryViewPage() {
  const { workId, entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!entryId || !workId) return;
    getEntry(entryId).then((e) => setEntry(e ?? null));
    listEntries(workId).then(setAllEntries);
  }, [entryId, workId]);

  const linkCandidates = useMemo(
    () => allEntries.filter((e) => e.id !== entryId).map((e) => ({ id: e.id, title: e.title })),
    [allEntries, entryId],
  );

  const entryById = useMemo(() => new Map(allEntries.map((e) => [e.id, e])), [allEntries]);

  async function handleDelete() {
    if (!entry) return;
    if (!confirm(`「${entry.title}」を削除します。よろしいですか？`)) return;
    await deleteEntry(entry.id);
    navigate(`/works/${workId}/entries`);
  }

  if (entry === undefined) return <p className="helper-text">読み込み中...</p>;
  if (entry === null) return <p>エントリが見つかりませんでした。</p>;

  const mainImage = entry.images.find((img) => img.isMain) ?? entry.images[0];
  const otherImages = entry.images.filter((img) => img.id !== mainImage?.id);

  return (
    <div>
      <div className="top-bar">
        <div>
          <h2 style={{ margin: '0 0 4px' }}>{entry.title || '(無題)'}</h2>
          <span className="chip">{entry.category || '未分類'}</span>
        </div>
        <div className="row">
          <a className="btn" href={`#/works/${workId}/graph/${entry.id}`}>
            関連を見る
          </a>
          <a className="btn" href={`#/works/${workId}/entries/${entry.id}/edit`}>
            編集
          </a>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>

      {entry.tags.length > 0 && (
        <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
          {entry.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {mainImage && <img className="thumb-lg" src={mainImage.dataUrl} alt={mainImage.caption} style={{ marginBottom: 14 }} />}

      {entry.properties.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row-list">
            {entry.properties.map((p, i) => (
              <div className="row" key={i}>
                <strong style={{ minWidth: 100 }}>{p.key}</strong>
                <span>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-title">本文</div>
      <WikiLinkText body={entry.body} candidates={linkCandidates} />

      {entry.relations.length > 0 && (
        <>
          <div className="section-title">関連</div>
          <div className="row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            {entry.relations.map((rel, i) => {
              const target = entryById.get(rel.targetId);
              return (
                <a key={i} className="chip" href={`#/works/${workId}/entries/${rel.targetId}`} style={{ textDecoration: 'none' }}>
                  {target ? target.title : '(削除済み)'}
                  {rel.label && ` · ${rel.label}`}
                </a>
              );
            })}
          </div>
        </>
      )}

      {otherImages.length > 0 && (
        <>
          <div className="section-title">画像</div>
          <div className="image-grid">
            {otherImages.map((img) => (
              <div key={img.id} className="image-card">
                <img src={img.dataUrl} alt={img.caption} />
                {img.caption && <span className="helper-text">{img.caption}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
