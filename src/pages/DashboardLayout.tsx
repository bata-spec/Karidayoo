import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { deleteWork, exportWork, getWork, renameWork } from '../db';
import { buildWorkZip } from '../utils/zip';
import type { Work } from '../types';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardLayout() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null | undefined>(undefined);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    if (!workId) return;
    getWork(workId).then((w) => setWork(w ?? null));
  }, [workId]);

  async function handleRename() {
    if (!work) return;
    const name = prompt('作品名を変更', work.name);
    if (!name || !name.trim()) return;
    await renameWork(work.id, name.trim());
    setWork({ ...work, name: name.trim() });
  }

  async function handleExportJson() {
    if (!workId) return;
    const data = await exportWork(workId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${data.work.name || 'work'}.json`);
  }

  async function handleExportZip() {
    if (!workId) return;
    setZipping(true);
    try {
      const data = await exportWork(workId);
      const blob = await buildWorkZip(data);
      downloadBlob(blob, `${data.work.name || 'work'}.zip`);
    } catch {
      alert('ZIPの作成に失敗しました。');
    } finally {
      setZipping(false);
    }
  }

  async function handleDelete() {
    if (!work) return;
    if (!confirm(`「${work.name}」を削除します。元に戻せません。よろしいですか？`)) return;
    await deleteWork(work.id);
    navigate('/');
  }

  if (work === undefined) {
    return <div className="page">読み込み中...</div>;
  }
  if (work === null) {
    return (
      <div className="page">
        <p>作品が見つかりませんでした。</p>
        <a className="btn" href="#/">
          ホームに戻る
        </a>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="top-bar">
        <div className="row">
          <a href="#/" className="btn btn-ghost" aria-label="ホームに戻る">
            ←
          </a>
          <h1>{work.name}</h1>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={handleRename}>
            名前変更
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportJson}>
            JSONエクスポート
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportZip} disabled={zipping}>
            {zipping ? 'ZIP作成中...' : 'ZIPエクスポート'}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>

      <nav className="tabs">
        <NavLink to="entries" className={({ isActive }) => (isActive ? 'active' : '')}>
          エントリ一覧
        </NavLink>
        <NavLink to="graph" className={({ isActive }) => (isActive ? 'active' : '')}>
          グラフビュー
        </NavLink>
        <NavLink to="templates" className={({ isActive }) => (isActive ? 'active' : '')}>
          テンプレート
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
