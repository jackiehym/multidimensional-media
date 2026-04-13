import Dexie, { type Table } from 'dexie';

export interface MediaItem {
  id?: number;
  filename: string;
  path: string;
  tags: string[];
  year?: number;
  resolution?: string;
  rating?: number;
  addedAt: Date;
}

export type TagCategory = 'year' | 'genre' | 'quality' | 'custom';

export interface Tag {
  id?: number;
  name: string;
  category: TagCategory;
  color: string;
}

export const TAG_CATEGORY_COLORS: Record<TagCategory, string> = {
  year: '220 10% 50%',
  genre: '210 70% 50%',
  quality: '150 60% 40%',
  custom: '270 60% 55%',
};

class TagFlowDB extends Dexie {
  mediaItems!: Table<MediaItem>;
  tags!: Table<Tag>;

  constructor() {
    super('TagFlowMedia');
    this.version(1).stores({
      mediaItems: '++id, filename, path, *tags, year, resolution, rating, addedAt',
      tags: '++id, &name, category',
    });
  }
}

export const db = new TagFlowDB();

// Seed default tags
export async function seedDefaultTags() {
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
