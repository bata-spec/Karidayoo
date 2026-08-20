import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWork, importWork, listWorks } from '../db';
import type { Work, WorkExport } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[] | null>(null);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listWorks().then(setWorks);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const work = await createWork(name);
    setNewName('');
    navigate(`/works/${work.id}/entries`);
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as WorkExport;
      if (!data.work || !Array.isArray(data.entries)) {
        alert('作品データの形式が正しくありません。');
        return;
      }
      const work = await importWork(data);
      setWorks(await listWorks());
      navigate(`/works/${work.id}/entries`);
    } catch {
      alert('読み込みに失敗しました。ファイル内容を確認してください。');
    }
  }

  return (
    <div className="page">
      <div className="top-bar">
        <h1>Karidayoo</h1>
      </div>

      <form onSubmit={handleCreate} className="row" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="新しい作品名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
          ＋ 作品を作る
        </button>
      </form>

      {works === null ? (
        <p className="helper-text">読み込み中...</p>
      ) : works.length === 0 ? (
        <div className="empty-state">
          <p>まだ作品がありません。上のフォームから作品を作成してください。</p>
        </div>
      ) : (
        <div className="card-list">
          {works.map((work) => (
            <a key={work.id} className="entry-row" href={`#/works/${work.id}/entries`}>
              <div>
                <div className="entry-row-title">{work.name}</div>
                <div className="entry-row-meta">更新: {new Date(work.updatedAt).toLocaleString('ja-JP')}</div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="section-title">作品データを読み込む</div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />
      <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
        JSONファイルからインポート
      </button>
    </div>
  );
}
