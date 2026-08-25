import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteTemplate, listTemplates, saveTemplate } from '../db';
import type { Property, Template } from '../types';
import { newId } from '../utils/id';

export default function TemplatesPage() {
  const { t } = useTranslation();
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
    if (!confirm(t('templates.deleteConfirm'))) return;
    await deleteTemplate(id);
    refresh();
  }

  return (
    <div>
      <p className="helper-text" style={{ marginBottom: 16 }}>
        {t('templates.helper')}
      </p>

      {templates.length === 0 ? (
        <div className="empty-state">
          <p>{t('templates.noTemplates')}</p>
        </div>
      ) : (
        <div className="card-list" style={{ marginBottom: 24 }}>
          {templates.map((tpl) => (
            <div className="card" key={tpl.id}>
              <div className="top-bar" style={{ marginBottom: 8 }}>
                <div>
                  <strong>{tpl.name}</strong> <span className="chip">{tpl.category}</span>
                </div>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(tpl.id)}>
                  {t('common.delete')}
                </button>
              </div>
              <div className="helper-text">{tpl.properties.map((p) => p.key).join(' / ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">{t('templates.newTemplateTitle')}</div>
      <form onSubmit={handleCreate} className="card">
        <div className="field">
          <label>{t('templates.nameLabel')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('templates.namePlaceholder')} />
        </div>
        <div className="field">
          <label>{t('templates.categoryLabel')}</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('templates.categoryPlaceholder')} />
        </div>
        <div className="field">
          <label>{t('templates.propertiesLabel')}</label>
          <div className="row-list">
            {properties.map((p, i) => (
              <div className="row" key={i}>
                <input
                  type="text"
                  value={p.key}
                  onChange={(e) => updateRow(i, 'key', e.target.value)}
                  placeholder={t('properties.keyPlaceholder')}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-ghost" onClick={() => removeRow(i)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setProperties([...properties, { key: '', value: '' }])}>
            {t('properties.addRow')}
          </button>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || !category.trim()}>
          {t('templates.saveButton')}
        </button>
      </form>
    </div>
  );
}
