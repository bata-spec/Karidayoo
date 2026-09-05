import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPlot, deletePlot, listPlots } from '../db';
import type { Plot } from '../types';

export default function PlotListPage() {
  const { t } = useTranslation();
  const { workId } = useParams();
  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => {
    if (!workId) return;
    setPlots(await listPlots(workId));
  }, [workId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workId || !name.trim()) return;
    await createPlot(workId, name.trim());
    setName('');
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('plot.deleteConfirm'))) return;
    await deletePlot(id);
    refresh();
  }

  return (
    <div>
      <p className="helper-text" style={{ marginBottom: 16 }}>
        {t('plot.helper')}
      </p>

      <form onSubmit={handleCreate} className="row" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t('plot.newPlotPlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          {t('plot.createPlot')}
        </button>
      </form>

      {plots === null ? (
        <p className="helper-text">{t('common.loading')}</p>
      ) : plots.length === 0 ? (
        <div className="empty-state">
          <p>{t('plot.noPlots')}</p>
        </div>
      ) : (
        <div className="card-list">
          {plots.map((plot) => (
            <div key={plot.id} className="entry-row">
              <a href={`#/works/${workId}/plots/${plot.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div className="entry-row-title">{plot.name}</div>
                <div className="entry-row-meta">{t('plot.blockCount', { count: plot.blocks.length })}</div>
              </a>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(plot.id)}>
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
