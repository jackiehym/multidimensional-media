import Dexie, { type Table } from 'dexie';

export interface MediaItem {
  id?: number;
  filename: string;
  display_name?: string;
  path: string;
  tags: string[];
  year?: number;
  resolution?: string;
  rating?: number;
  addedAt: Date;
}

export type TagCategory = string;

export interface Tag {
  id?: number;
  name: string;
  category: TagCategory;
  color: string;
}

export interface TagCategoryDef {
  id?: number;
  key: string;
  label: string;
  emoji: string;
  color: string;
  builtIn: boolean;
}

export const DEFAULT_CATEGORIES: TagCategoryDef[] = [
  { key: 'genre', label: '类型', emoji: '🎬', color: '210 70% 50%', builtIn: true },
  { key: 'quality', label: '画质', emoji: '📺', color: '150 60% 40%', builtIn: true },
  { key: 'year', label: '年份', emoji: '📅', color: '220 10% 50%', builtIn: true },
  { key: 'custom', label: '自定义', emoji: '🏷️', color: '270 60% 55%', builtIn: true },
];

export const TAG_CATEGORY_COLORS: Record<string, string> = {
  year: '220 10% 50%',
  genre: '210 70% 50%',
  quality: '150 60% 40%',
  custom: '270 60% 55%',
};

class TagFlowDB extends Dexie {
  mediaItems!: Table<MediaItem>;
  tags!: Table<Tag>;
  tagCategories!: Table<TagCategoryDef>;

  constructor() {
    super('TagFlowMedia');
    this.version(1).stores({
      mediaItems: '++id, filename, path, *tags, year, resolution, rating, addedAt',
      tags: '++id, &name, category',
    });
    this.version(2).stores({
      mediaItems: '++id, filename, path, *tags, year, resolution, rating, addedAt',
      tags: '++id, &name, category',
      tagCategories: '++id, &key',
    });
  }
}

export const db = new TagFlowDB();

// Seed default tags and categories
export async function seedDefaultTags() {
  // Seed categories
  const catCount = await db.tagCategories.count();
  if (catCount === 0) {
    await db.tagCategories.bulkAdd(DEFAULT_CATEGORIES);
  }

  const count = await db.tags.count();
  if (count > 0) return;
  await db.tags.bulkAdd([
    { name: '4K', category: 'quality', color: TAG_CATEGORY_COLORS.quality },
    { name: '1080p', category: 'quality', color: TAG_CATEGORY_COLORS.quality },
    { name: '720p', category: 'quality', color: TAG_CATEGORY_COLORS.quality },
    { name: 'Action', category: 'genre', color: TAG_CATEGORY_COLORS.genre },
    { name: 'Sci-Fi', category: 'genre', color: TAG_CATEGORY_COLORS.genre },
    { name: 'Drama', category: 'genre', color: TAG_CATEGORY_COLORS.genre },
    { name: 'Comedy', category: 'genre', color: TAG_CATEGORY_COLORS.genre },
    { name: 'Horror', category: 'genre', color: TAG_CATEGORY_COLORS.genre },
    { name: 'Thriller', category: 'genre', color: TAG_CATEGORY_COLORS.genre },
    { name: '待看', category: 'custom', color: TAG_CATEGORY_COLORS.custom },
    { name: '已看', category: 'custom', color: TAG_CATEGORY_COLORS.custom },
    { name: '收藏', category: 'custom', color: TAG_CATEGORY_COLORS.custom },
  ]);
}
