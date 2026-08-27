import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteWork, exportWork, getWork, listEntries, renameWork, replaceWorkContent } from '../db';
import { buildWorkZip, parseImportFile } from '../utils/zip';
import LanguageSwitcher from '../components/LanguageSwitcher';
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
  const { t } = useTranslation();
  const { workId } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null | undefined>(undefined);
  const [zipping, setZipping] = useState(false);
  const [updating, setUpdating] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!workId) return;
    getWork(workId).then((w) => setWork(w ?? null));
  }, [workId]);

  async function handleRename() {
    if (!work) return;
    const name = prompt(t('work.renamePrompt'), work.name);
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
      alert(t('errors.zipCreateFailed'));
    } finally {
      setZipping(false);
    }
  }

  async function handleDelete() {
    if (!work) return;
    if (!confirm(t('work.deleteConfirm', { name: work.name }))) return;
    await deleteWork(work.id);
    navigate('/');
  }

  async function handleUpdateFromFile(file: File) {
    if (!work) return;
    setUpdating(true);
    try {
      const data = await parseImportFile(file);
      if (!data.work || !Array.isArray(data.entries)) {
        alert(t('errors.invalidWorkData'));
        return;
      }
      const currentEntries = await listEntries(work.id);
      const message = t('work.updateConfirm', {
        name: work.name,
        oldCount: currentEntries.length,
        newCount: data.entries.length,
      });
      if (!confirm(message)) return;
      await replaceWorkContent(work.id, data);
      navigate(0);
    } catch {
      alert(t('errors.importFailed'));
    } finally {
      setUpdating(false);
    }
  }

  if (work === undefined) {
    return <div className="page">{t('common.loading')}</div>;
  }
  if (work === null) {
    return (
      <div className="page">
        <p>{t('work.notFound')}</p>
        <a className="btn" href="#/">
          {t('work.backToHome')}
        </a>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="top-bar">
        <div className="row">
          <a href="#/" className="btn btn-ghost" aria-label={t('work.backToHome')}>
            ←
          </a>
          <h1>{work.name}</h1>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <LanguageSwitcher />
          <button type="button" className="btn btn-ghost" onClick={handleRename}>
            {t('work.rename')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportJson}>
            {t('work.exportJson')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportZip} disabled={zipping}>
            {zipping ? t('work.zipping') : t('work.exportZip')}
          </button>
          <input
            ref={updateFileInputRef}
            type="file"
            accept="application/json,.json,application/zip,.zip"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpdateFromFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => updateFileInputRef.current?.click()}
            disabled={updating}
          >
            {updating ? t('work.updating') : t('work.updateFromFile')}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      <nav className="tabs">
        <NavLink to="entries" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('nav.entries')}
        </NavLink>
        <NavLink to="graph" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('nav.graph')}
        </NavLink>
        <NavLink to="templates" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('nav.templates')}
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
