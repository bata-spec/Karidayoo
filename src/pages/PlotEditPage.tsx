import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPlot, savePlot } from '../db';
import type { Plot, PlotBlock } from '../types';
import { newId } from '../utils/id';

export default function PlotEditPage() {
  const { t } = useTranslation();
  const { workId, plotId } = useParams();
  const navigate = useNavigate();
  const [plot, setPlot] = useState<Plot | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<PlotBlock[]>([]);

  useEffect(() => {
    if (!plotId) return;
    getPlot(plotId).then((p) => {
      setPlot(p ?? null);
      if (p) {
        setName(p.name);
        setBlocks(p.blocks);
      }
    });
  }, [plotId]);

  function updateBlock(index: number, field: 'title' | 'body', value: string) {
    setBlocks(blocks.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  }

  function addBlock() {
    setBlocks([...blocks, { id: newId('block'), title: '', body: '' }]);
  }

  function removeBlock(index: number) {
    setBlocks(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  }

  async function handleSave() {
    if (!plot) return;
    const updated: Plot = { ...plot, name: name.trim() || plot.name, blocks };
    await savePlot(updated);
    navigate(`/works/${workId}/plots`);
  }

  if (plot === undefined) return <p className="helper-text">{t('common.loading')}</p>;
  if (plot === null) return <p>{t('plot.notFound')}</p>;

  return (
    <div>
      <div className="top-bar">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1, marginRight: 12 }}
        />
        <div className="row">
          <button type="button" className="btn" onClick={() => navigate(`/works/${workId}/plots`)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="card-list" style={{ marginBottom: 16 }}>
        {blocks.map((block, i) => (
          <div className="card" key={block.id}>
            <div className="row" style={{ marginBottom: 8 }}>
              <input
                type="text"
                value={block.title}
                onChange={(e) => updateBlock(i, 'title', e.target.value)}
                placeholder={t('plot.blockTitlePlaceholder')}
                style={{ flex: 1, fontWeight: 600 }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label={t('common.moveUp')}>
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => moveBlock(i, 1)}
                disabled={i === blocks.length - 1}
                aria-label={t('common.moveDown')}
              >
                ↓
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => removeBlock(i)}>
                ✕
              </button>
            </div>
            <textarea
              className="plain-textarea"
              value={block.body}
              onChange={(e) => updateBlock(i, 'body', e.target.value)}
              placeholder={t('plot.blockBodyPlaceholder')}
              style={{ minHeight: 100 }}
            />
          </div>
        ))}
      </div>

      <button type="button" className="btn" onClick={addBlock}>
        {t('plot.addBlock')}
      </button>
    </div>
  );
}
