import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deleteTemplate, listTemplates, saveTemplate } from '../db';
import type { Property, Template } from '../types';
import { newId } from '../utils/id';

export default function TemplatesPage() {
  const { workId } = useParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [properties, setProperties] = useState<Property[]>([{ key: '', value: '' }]);

  const refresh = useCallback(async () => {
    if (!workId) return;
    setTemplates(await listTemplates(workId));
  }, [workId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateRow(index: number, field: 'key' | 'value', value: string) {
    setProperties(properties.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function removeRow(index: number) {
    setProperties(properties.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workId || !name.trim() || !category.trim()) return;
    const template: Template = {
      id: newId('template'),
      workId,
      name: name.trim(),
      category: category.trim(),
      properties: properties.filter((p) => p.key.trim()),
    };
    await saveTemplate(template);
    setName('');
    setCategory('');
    setProperties([{ key: '', value: '' }]);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('このテンプレートを削除しますか？')) return;
    await deleteTemplate(id);
    refresh();
  }

  return (
    <div>
      <p className="helper-text" style={{ marginBottom: 16 }}>
        カテゴリごとによく使う項目セットを登録しておくと、エントリ編集時に「テンプレートから挿入」でまとめて追加できます。
      </p>

      {templates.length === 0 ? (
        <div className="empty-state">
          <p>まだテンプレートがありません。</p>
        </div>
      ) : (
        <div className="card-list" style={{ marginBottom: 24 }}>
          {templates.map((t) => (
            <div className="card" key={t.id}>
              <div className="top-bar" style={{ marginBottom: 8 }}>
                <div>
                  <strong>{t.name}</strong> <span className="chip">{t.category}</span>
                </div>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(t.id)}>
                  削除
                </button>
              </div>
              <div className="helper-text">{t.properties.map((p) => p.key).join(' / ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">新しいテンプレートを作る</div>
      <form onSubmit={handleCreate} className="card">
        <div className="field">
          <label>テンプレート名</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例:キャラクター基本情報" />
        </div>
        <div className="field">
          <label>対象カテゴリ</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例:キャラクター" />
        </div>
        <div className="field">
          <label>項目名(値は空のまま挿入されます)</label>
          <div className="row-list">
            {properties.map((p, i) => (
              <div className="row" key={i}>
                <input
                  type="text"
                  value={p.key}
                  onChange={(e) => updateRow(i, 'key', e.target.value)}
                  placeholder="項目名(例:年齢)"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-ghost" onClick={() => removeRow(i)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setProperties([...properties, { key: '', value: '' }])}>
            ＋ 項目を追加
          </button>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || !category.trim()}>
          テンプレートを保存
        </button>
      </form>
    </div>
  );
}
