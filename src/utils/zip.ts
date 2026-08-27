import JSZip from 'jszip';
import i18n from '../i18n';
import type { Entry, EntryLayout, ImageRef, Template, Work, WorkExport } from '../types';

interface ZipImageRef {
  id: string;
  file: string;
  caption: string;
  isMain: boolean;
}

interface ZipEntryJson {
  id: string;
  category: string;
  title: string;
  tags: string[];
  properties: Entry['properties'];
  body: string;
  relations: Entry['relations'];
  images: ZipImageRef[];
  layout?: EntryLayout;
  createdAt: string;
  updatedAt: string;
}

interface ZipWorkJson {
  version: 1;
  work: Work;
  templates: Template[];
}

export async function buildWorkZip(data: WorkExport): Promise<Blob> {
  const zip = new JSZip();

  const workJson: ZipWorkJson = { version: 1, work: data.work, templates: data.templates };
  zip.file('work.json', JSON.stringify(workJson, null, 2));

  const entriesFolder = zip.folder('entries')!;
  const imagesFolder = zip.folder('images')!;

  for (const entry of data.entries) {
    const imageRefs: ZipImageRef[] = [];
    for (const img of entry.images) {
      const base64 = img.dataUrl.split(',')[1] ?? '';
      const filename = `${img.id}.jpg`;
      imagesFolder.file(filename, base64, { base64: true });
      imageRefs.push({ id: img.id, file: `images/${filename}`, caption: img.caption, isMain: img.isMain });
    }

    const entryJson: ZipEntryJson = {
      id: entry.id,
      category: entry.category,
      title: entry.title,
      tags: entry.tags,
      properties: entry.properties,
      body: entry.body,
      relations: entry.relations,
      images: imageRefs,
      layout: entry.layout,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
    entriesFolder.file(`${entry.id}.json`, JSON.stringify(entryJson, null, 2));
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function parseWorkZip(file: File): Promise<WorkExport> {
  const zip = await JSZip.loadAsync(file);

  const workFile = zip.file('work.json');
  if (!workFile) throw new Error(i18n.t('errors.zipMissingWorkJson', { appName: i18n.t('app.name') }));
  const workJson = JSON.parse(await workFile.async('string')) as ZipWorkJson;

  const entryFiles: JSZip.JSZipObject[] = [];
  zip.forEach((relativePath, entry) => {
    if (!entry.dir && relativePath.startsWith('entries/') && relativePath.endsWith('.json')) {
      entryFiles.push(entry);
    }
  });

  const entries: Entry[] = [];
  for (const entryFile of entryFiles) {
    const raw = JSON.parse(await entryFile.async('string')) as ZipEntryJson;

    const images: ImageRef[] = [];
    for (const imgRef of raw.images ?? []) {
      const imgFile = zip.file(imgRef.file);
      if (!imgFile) continue;
      const base64 = await imgFile.async('base64');
      images.push({
        id: imgRef.id,
        dataUrl: `data:image/jpeg;base64,${base64}`,
        caption: imgRef.caption ?? '',
        isMain: imgRef.isMain ?? false,
      });
    }

    entries.push({
      id: raw.id,
      workId: workJson.work.id,
      category: raw.category ?? i18n.t('common.uncategorized'),
      title: raw.title ?? i18n.t('common.untitled'),
      tags: raw.tags ?? [],
      properties: raw.properties ?? [],
      body: raw.body ?? '',
      relations: raw.relations ?? [],
      images,
      layout: raw.layout === 'thumbnail' ? 'thumbnail' : 'banner',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  return { version: 1, work: workJson.work, entries, templates: workJson.templates ?? [] };
}
