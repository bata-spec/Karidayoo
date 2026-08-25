import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEntry, listEntries, listTemplates, saveEntry } from '../db';
import type { Entry, Property, Relation, ImageRef } from '../types';
import { newId } from '../utils/id';
import PropertiesEditor from '../components/PropertiesEditor';
import RelationsEditor from '../components/RelationsEditor';
import ImagesEditor from '../components/ImagesEditor';

export default function EntryEditPage() {
  const { t } = useTranslation();
  const { workId, entryId } = useParams();
  const navigate = useNavigate();
  const isNew = !entryId;

  const [loaded, setLoaded] = useState(isNew);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [body, setBody] = useState('');
  const [relations, setRelations] = useState<Relation[]>([]);
  const [images, setImages] = useState<ImageRef[]>([]);
  const [createdAt, setCreatedAt] = useState('');

  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [templates, setTemplates] = useState<Awaited<ReturnType<typeof listTemplates>>>([]);

  useEffect(() => {
    if (!workId) return;
    listEntries(workId).then(setAllEntries);
    listTemplates(workId).then(setTemplates);
  }, [workId]);

  useEffect(() => {
    if (isNew || !entryId) return;
    getEntry(entryId).then((entry) => {
      if (entry) {
        setTitle(entry.title);
        setCategory(entry.category);
        setTags(entry.tags);
        setProperties(entry.properties);
        setBody(entry.body);
        setRelations(entry.relations);
        setImages(entry.images);
        setCreatedAt(entry.createdAt);
      }
      setLoaded(true);
    });
  }, [entryId, isNew]);

  const categories = useMemo(
    () => Array.from(new Set(allEntries.map((e) => e.category).filter(Boolean))),
    [allEntries],
  );

  const categoryTemplates = useMemo(
    () => templates.filter((tpl) => tpl.category === category),
    [templates, category],
  );

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t2) => t2 !== tag));
  }

  async function handleSave() {
    if (!workId) return;
    const now = new Date().toISOString();
    const entry: Entry = {
      id: entryId ?? newId('entry'),
      workId,
      category: category.trim() || t('common.uncategorized'),
      title: title.trim() || t('common.untitled'),
      tags,
      properties: properties.filter((p) => p.key.trim() || p.value.trim()),
      body,
      relations,
      images,
      createdAt: createdAt || now,
      updatedAt: now,
    };
    await saveEntry(entry);
    navigate(`/works/${workId}/entries/${entry.id}`);
  }

  if (!loaded) return <p className="helper-text">{t('common.loading')}</p>;

  return (
    <div>
      <div className="top-bar">
        <h2 style={{ margin: 0 }}>{isNew ? t('entryEdit.newTitle') : t('entryEdit.editTitle')}</h2>
        <div className="row">
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="field">
        <label>{t('entryEdit.titleLabel')}</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('entryEdit.titlePlaceholder')} />
      </div>

      <div className="field">
        <label>{t('entryEdit.categoryLabel')}</label>
        <input
          type="text"
          list="category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t('entryEdit.categoryPlaceholder')}
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label>{t('entryEdit.tagsLabel')}</label>
        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
          {tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={t('entryEdit.removeTagAria')}>
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="row">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={t('entryEdit.tagInputPlaceholder')}
          />
          <button type="button" className="btn" onClick={addTag}>
            {t('common.add')}
          </button>
        </div>
      </div>

      <div className="section-title">{t('entryEdit.propertiesTitle')}</div>
      <PropertiesEditor properties={properties} onChange={setProperties} templates={categoryTemplates} />

      <div className="section-title">{t('entryView.bodyTitle')}</div>
      <div className="field">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('entryEdit.bodyPlaceholder')} />
      </div>

      <div className="section-title">{t('entryView.relationsTitle')}</div>
      <RelationsEditor
        relations={relations}
        onChange={setRelations}
        allEntries={allEntries}
        currentEntryId={entryId}
      />

      <div className="section-title">{t('entryView.imagesTitle')}</div>
      <ImagesEditor images={images} onChange={setImages} />
    </div>
  );
}
