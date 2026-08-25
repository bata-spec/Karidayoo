import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Property, Template } from '../types';

interface Props {
  properties: Property[];
  onChange: (properties: Property[]) => void;
  templates: Template[];
}

export default function PropertiesEditor({ properties, onChange, templates }: Props) {
  const { t } = useTranslation();
  const [showTemplates, setShowTemplates] = useState(false);

  function updateRow(index: number, field: 'key' | 'value', value: string) {
    const next = properties.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(properties.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...properties, { key: '', value: '' }]);
  }

  function insertTemplate(template: Template) {
    const existingKeys = new Set(properties.map((p) => p.key));
    const additions = template.properties.filter((p) => !existingKeys.has(p.key));
    onChange([...properties, ...additions]);
    setShowTemplates(false);
  }

  return (
    <div>
      <div className="row-list">
        {properties.map((prop, index) => (
          <div className="row" key={index}>
            <input
              type="text"
              placeholder={t('properties.keyPlaceholder')}
              value={prop.key}
              onChange={(e) => updateRow(index, 'key', e.target.value)}
              style={{ flex: '0 0 38%' }}
            />
            <input
              type="text"
              placeholder={t('properties.valuePlaceholder')}
              value={prop.value}
              onChange={(e) => updateRow(index, 'value', e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-ghost" onClick={() => removeRow(index)} aria-label={t('properties.removeAria')}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={addRow}>
          {t('properties.addRow')}
        </button>
        {templates.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button type="button" className="btn" onClick={() => setShowTemplates((v) => !v)}>
              {t('properties.insertFromTemplate')}
            </button>
            {showTemplates && (
              <div
                className="card"
                style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, minWidth: 200 }}
              >
                <div className="row-list">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="btn btn-ghost"
                      style={{ justifyContent: 'flex-start' }}
                      onClick={() => insertTemplate(tpl)}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
