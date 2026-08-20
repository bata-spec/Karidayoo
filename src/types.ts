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
  createdAt: string;
  updatedAt: string;
}

export interface Work {
  id: string;
  name: string;
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

export interface WorkExport {
  version: 1;
  work: Work;
  entries: Entry[];
  templates: Template[];
}
