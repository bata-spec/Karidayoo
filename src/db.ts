import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import i18n from './i18n';
import type { Work, Entry, Template, WorkExport } from './types';
import { newId } from './utils/id';

interface KaridayooDB extends DBSchema {
  works: { key: string; value: Work };
  entries: { key: string; value: Entry; indexes: { workId: string } };
  templates: { key: string; value: Template; indexes: { workId: string } };
}

let dbPromise: Promise<IDBPDatabase<KaridayooDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<KaridayooDB>('karidayoo', 1, {
      upgrade(db) {
        db.createObjectStore('works', { keyPath: 'id' });
        const entries = db.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('workId', 'workId');
        const templates = db.createObjectStore('templates', { keyPath: 'id' });
        templates.createIndex('workId', 'workId');
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

export async function deleteWork(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['works', 'entries', 'templates'], 'readwrite');
  await tx.objectStore('works').delete(id);
  const entryIndex = tx.objectStore('entries').index('workId');
  for await (const cursor of entryIndex.iterate(id)) {
    await cursor.delete();
  }
  const templateIndex = tx.objectStore('templates').index('workId');
  for await (const cursor of templateIndex.iterate(id)) {
    await cursor.delete();
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

export async function exportWork(workId: string): Promise<WorkExport> {
  const db = await getDB();
  const work = await db.get('works', workId);
  if (!work) throw new Error(i18n.t('errors.workNotFound'));
  const entries = await db.getAllFromIndex('entries', 'workId', workId);
  const templates = await db.getAllFromIndex('templates', 'workId', workId);
  return { version: 1, work, entries, templates };
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
  const tx = db.transaction(['works', 'entries', 'templates'], 'readwrite');
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

  await tx.done;
  return work;
}
