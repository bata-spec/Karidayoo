import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import i18n from './i18n';
import type { Work, Entry, Template, WorkExport, Plot, Timeline, ManuscriptChapter } from './types';
import { newId } from './utils/id';

interface KaridayooDB extends DBSchema {
  works: { key: string; value: Work };
  entries: { key: string; value: Entry; indexes: { workId: string } };
  templates: { key: string; value: Template; indexes: { workId: string } };
  plots: { key: string; value: Plot; indexes: { workId: string } };
  timelines: { key: string; value: Timeline; indexes: { workId: string } };
  manuscriptChapters: { key: string; value: ManuscriptChapter; indexes: { workId: string } };
}

const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<KaridayooDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<KaridayooDB>('karidayoo', DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('works', { keyPath: 'id' });
          const entries = db.createObjectStore('entries', { keyPath: 'id' });
          entries.createIndex('workId', 'workId');
          const templates = db.createObjectStore('templates', { keyPath: 'id' });
          templates.createIndex('workId', 'workId');
        }
        if (oldVersion < 2) {
          const plots = db.createObjectStore('plots', { keyPath: 'id' });
          plots.createIndex('workId', 'workId');
          const timelines = db.createObjectStore('timelines', { keyPath: 'id' });
          timelines.createIndex('workId', 'workId');
          const manuscriptChapters = db.createObjectStore('manuscriptChapters', { keyPath: 'id' });
          manuscriptChapters.createIndex('workId', 'workId');
        }
      },
    });
  }
  return dbPromise;
}

function nowIso() {
  return new Date().toISOString();
}

export async function listWorks(): Promise<Work[]> {
  const db = await getDB();
  const works = await db.getAll('works');
  return works.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getWork(id: string): Promise<Work | undefined> {
  const db = await getDB();
  return db.get('works', id);
}

export async function createWork(name: string): Promise<Work> {
  const db = await getDB();
  const work: Work = { id: newId('work'), name, createdAt: nowIso(), updatedAt: nowIso() };
  await db.put('works', work);
  return work;
}

export async function renameWork(id: string, name: string): Promise<void> {
  const db = await getDB();
  const work = await db.get('works', id);
  if (!work) return;
  work.name = name;
  work.updatedAt = nowIso();
  await db.put('works', work);
}

export interface WorkSettings {
  genre?: string;
  categories?: string[];
  targetWordCount?: number;
}

export async function updateWorkSettings(id: string, settings: WorkSettings): Promise<void> {
  const db = await getDB();
  const work = await db.get('works', id);
  if (!work) return;
  work.genre = settings.genre;
  work.categories = settings.categories;
  work.targetWordCount = settings.targetWordCount;
  work.updatedAt = nowIso();
  await db.put('works', work);
}

const WORK_SCOPED_STORES = ['entries', 'templates', 'plots', 'timelines', 'manuscriptChapters'] as const;

export async function deleteWork(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['works', ...WORK_SCOPED_STORES], 'readwrite');
  await tx.objectStore('works').delete(id);
  for (const storeName of WORK_SCOPED_STORES) {
    const index = tx.objectStore(storeName).index('workId');
    for await (const cursor of index.iterate(id)) {
      await cursor.delete();
    }
  }
  await tx.done;
}

export async function listEntries(workId: string): Promise<Entry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'workId', workId);
  return entries.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  const db = await getDB();
  return db.get('entries', id);
}

export async function saveEntry(entry: Entry): Promise<void> {
  const db = await getDB();
  entry.updatedAt = nowIso();
  await db.put('entries', entry);
  const work = await db.get('works', entry.workId);
  if (work) {
    work.updatedAt = nowIso();
    await db.put('works', work);
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('entries', id);
  if (!entry) return;
  const others = await db.getAllFromIndex('entries', 'workId', entry.workId);
  const tx = db.transaction('entries', 'readwrite');
  await tx.store.delete(id);
  for (const other of others) {
    if (other.id === id) continue;
    const filtered = other.relations.filter((r) => r.targetId !== id);
    if (filtered.length !== other.relations.length) {
      await tx.store.put({ ...other, relations: filtered });
    }
  }
  await tx.done;
}

export async function listTemplates(workId: string): Promise<Template[]> {
  const db = await getDB();
  return db.getAllFromIndex('templates', 'workId', workId);
}

export async function saveTemplate(template: Template): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

export async function listPlots(workId: string): Promise<Plot[]> {
  const db = await getDB();
  const plots = await db.getAllFromIndex('plots', 'workId', workId);
  return plots.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPlot(id: string): Promise<Plot | undefined> {
  const db = await getDB();
  return db.get('plots', id);
}

export async function createPlot(workId: string, name: string): Promise<Plot> {
  const db = await getDB();
  const plot: Plot = { id: newId('plot'), workId, name, blocks: [], createdAt: nowIso(), updatedAt: nowIso() };
  await db.put('plots', plot);
  return plot;
}

export async function savePlot(plot: Plot): Promise<void> {
  const db = await getDB();
  plot.updatedAt = nowIso();
  await db.put('plots', plot);
}

export async function deletePlot(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('plots', id);
}

export async function listTimelines(workId: string): Promise<Timeline[]> {
  const db = await getDB();
  const timelines = await db.getAllFromIndex('timelines', 'workId', workId);
  return timelines.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getTimeline(id: string): Promise<Timeline | undefined> {
  const db = await getDB();
  return db.get('timelines', id);
}

export async function createTimeline(workId: string, name: string): Promise<Timeline> {
  const db = await getDB();
  const timeline: Timeline = { id: newId('timeline'), workId, name, events: [], createdAt: nowIso(), updatedAt: nowIso() };
  await db.put('timelines', timeline);
  return timeline;
}

export async function saveTimeline(timeline: Timeline): Promise<void> {
  const db = await getDB();
  timeline.updatedAt = nowIso();
  await db.put('timelines', timeline);
}

export async function deleteTimeline(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('timelines', id);
}

export async function listManuscriptChapters(workId: string): Promise<ManuscriptChapter[]> {
  const db = await getDB();
  const chapters = await db.getAllFromIndex('manuscriptChapters', 'workId', workId);
  return chapters.sort((a, b) => a.order - b.order);
}

export async function getManuscriptChapter(id: string): Promise<ManuscriptChapter | undefined> {
  const db = await getDB();
  return db.get('manuscriptChapters', id);
}

export async function createManuscriptChapter(workId: string, title: string): Promise<ManuscriptChapter> {
  const db = await getDB();
  const existing = await db.getAllFromIndex('manuscriptChapters', 'workId', workId);
  const order = existing.length === 0 ? 0 : Math.max(...existing.map((c) => c.order)) + 1;
  const chapter: ManuscriptChapter = {
    id: newId('chapter'),
    workId,
    title,
    body: '',
    order,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.put('manuscriptChapters', chapter);
  return chapter;
}

export async function saveManuscriptChapter(chapter: ManuscriptChapter): Promise<void> {
  const db = await getDB();
  chapter.updatedAt = nowIso();
  await db.put('manuscriptChapters', chapter);
}

export async function deleteManuscriptChapter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('manuscriptChapters', id);
}

export async function reorderManuscriptChapters(chapters: ManuscriptChapter[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('manuscriptChapters', 'readwrite');
  await Promise.all(chapters.map((c, order) => tx.store.put({ ...c, order })));
  await tx.done;
}

export async function exportWork(workId: string): Promise<WorkExport> {
  const db = await getDB();
  const work = await db.get('works', workId);
  if (!work) throw new Error(i18n.t('errors.workNotFound'));
  const entries = await db.getAllFromIndex('entries', 'workId', workId);
  const templates = await db.getAllFromIndex('templates', 'workId', workId);
  const plots = await db.getAllFromIndex('plots', 'workId', workId);
  const timelines = await db.getAllFromIndex('timelines', 'workId', workId);
  const manuscriptChapters = await db.getAllFromIndex('manuscriptChapters', 'workId', workId);
  return { version: 1, work, entries, templates, plots, timelines, manuscriptChapters };
}

export async function importWork(data: WorkExport): Promise<Work> {
  const db = await getDB();
  const idMap = new Map<string, string>();
  const newWorkId = newId('work');
  idMap.set(data.work.id, newWorkId);
  for (const entry of data.entries) {
    idMap.set(entry.id, newId('entry'));
  }

  const work: Work = { ...data.work, id: newWorkId, updatedAt: nowIso() };
  const tx = db.transaction(['works', 'entries', 'templates', 'plots', 'timelines', 'manuscriptChapters'], 'readwrite');
  await tx.objectStore('works').put(work);

  for (const entry of data.entries) {
    const remapped: Entry = {
      ...entry,
      id: idMap.get(entry.id)!,
      workId: newWorkId,
      relations: entry.relations
        .filter((r) => idMap.has(r.targetId))
        .map((r) => ({ ...r, targetId: idMap.get(r.targetId)! })),
    };
    await tx.objectStore('entries').put(remapped);
  }

  for (const template of data.templates) {
    await tx.objectStore('templates').put({ ...template, id: newId('template'), workId: newWorkId });
  }

  for (const plot of data.plots ?? []) {
    await tx.objectStore('plots').put({ ...plot, id: newId('plot'), workId: newWorkId });
  }

  for (const timeline of data.timelines ?? []) {
    await tx.objectStore('timelines').put({ ...timeline, id: newId('timeline'), workId: newWorkId });
  }

  for (const chapter of data.manuscriptChapters ?? []) {
    await tx.objectStore('manuscriptChapters').put({ ...chapter, id: newId('chapter'), workId: newWorkId });
  }

  await tx.done;
  return work;
}

export async function replaceWorkContent(workId: string, data: WorkExport): Promise<void> {
  const db = await getDB();
  const idMap = new Map<string, string>();
  for (const entry of data.entries) {
    idMap.set(entry.id, newId('entry'));
  }

  const stores = ['works', 'entries', 'templates', 'plots', 'timelines', 'manuscriptChapters'] as const;
  const tx = db.transaction(stores, 'readwrite');

  const entryStore = tx.objectStore('entries');
  const oldEntries = await entryStore.index('workId').getAllKeys(workId);
  for (const key of oldEntries) {
    await entryStore.delete(key);
  }

  const templateStore = tx.objectStore('templates');
  const oldTemplates = await templateStore.index('workId').getAllKeys(workId);
  for (const key of oldTemplates) {
    await templateStore.delete(key);
  }

  const plotStore = tx.objectStore('plots');
  for (const key of await plotStore.index('workId').getAllKeys(workId)) {
    await plotStore.delete(key);
  }

  const timelineStore = tx.objectStore('timelines');
  for (const key of await timelineStore.index('workId').getAllKeys(workId)) {
    await timelineStore.delete(key);
  }

  const chapterStore = tx.objectStore('manuscriptChapters');
  for (const key of await chapterStore.index('workId').getAllKeys(workId)) {
    await chapterStore.delete(key);
  }

  for (const entry of data.entries) {
    const remapped: Entry = {
      ...entry,
      id: idMap.get(entry.id)!,
      workId,
      relations: entry.relations
        .filter((r) => idMap.has(r.targetId))
        .map((r) => ({ ...r, targetId: idMap.get(r.targetId)! })),
    };
    await entryStore.put(remapped);
  }

  for (const template of data.templates) {
    await templateStore.put({ ...template, id: newId('template'), workId });
  }

  for (const plot of data.plots ?? []) {
    await plotStore.put({ ...plot, id: newId('plot'), workId });
  }

  for (const timeline of data.timelines ?? []) {
    await timelineStore.put({ ...timeline, id: newId('timeline'), workId });
  }

  for (const chapter of data.manuscriptChapters ?? []) {
    await chapterStore.put({ ...chapter, id: newId('chapter'), workId });
  }

  const work = await tx.objectStore('works').get(workId);
  if (work) {
    work.updatedAt = nowIso();
    await tx.objectStore('works').put(work);
  }

  await tx.done;
}
