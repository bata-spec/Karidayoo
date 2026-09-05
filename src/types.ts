export interface Property {
  key: string;
  value: string;
}

export interface Relation {
  targetId: string;
  label: string;
}

export interface ImageRef {
  id: string;
  dataUrl: string;
  caption: string;
  isMain: boolean;
}

export type EntryLayout = 'banner' | 'thumbnail';

export interface Entry {
  id: string;
  workId: string;
  category: string;
  title: string;
  tags: string[];
  properties: Property[];
  body: string;
  relations: Relation[];
  images: ImageRef[];
  layout?: EntryLayout;
  createdAt: string;
  updatedAt: string;
}

export interface Work {
  id: string;
  name: string;
  genre?: string;
  categories?: string[];
  targetWordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  workId: string;
  category: string;
  name: string;
  properties: Property[];
}

export interface PlotBlock {
  id: string;
  title: string;
  body: string;
}

export interface Plot {
  id: string;
  workId: string;
  name: string;
  blocks: PlotBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  body: string;
}

export interface Timeline {
  id: string;
  workId: string;
  name: string;
  events: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ManuscriptChapter {
  id: string;
  workId: string;
  title: string;
  body: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExport {
  version: 1;
  work: Work;
  entries: Entry[];
  templates: Template[];
  plots?: Plot[];
  timelines?: Timeline[];
  manuscriptChapters?: ManuscriptChapter[];
}
