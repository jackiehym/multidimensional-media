import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MediaItem, type Tag, type TagCategoryDef, seedDefaultTags } from '@/lib/db';
import { parseFilename, getTagCategoryForName } from '@/lib/filename-parser';
import { useEffect } from 'react';

export function useMediaStore() {
  useEffect(() => { seedDefaultTags(); }, []);

  const allMedia = useLiveQuery(() => db.mediaItems.toArray()) ?? [];
  const allTags = useLiveQuery(() => db.tags.toArray()) ?? [];
  const allCategories = useLiveQuery(() => db.tagCategories.toArray()) ?? [];

  /** Find existing tag by case-insensitive match */
  async function findTagCaseInsensitive(name: string): Promise<Tag | undefined> {
    const exact = await db.tags.where('name').equals(name).first();
    if (exact) return exact;
    // Fallback: scan for case-insensitive match
    const lower = name.toLowerCase();
    const all = await db.tags.toArray();
    return all.find(t => t.name.toLowerCase() === lower);
  }

  async function ensureTag(name: string, categoryHint?: string): Promise<string> {
    const existing = await findTagCaseInsensitive(name);
    if (existing) return existing.name; // return canonical name
    const cat = categoryHint ?? getTagCategoryForName(name).category;
    const catDef = await db.tagCategories.where('key').equals(cat).first();
    const color = catDef?.color ?? '270 60% 55%';
    await db.tags.add({ name, category: cat, color });
    return name;
  }

  async function addMedia(item: Omit<MediaItem, 'id' | 'addedAt'>): Promise<number> {
    const parsed = parseFilename(item.filename);
    const rawTags = [...new Set([...item.tags, ...parsed.tags])];
    const tags: string[] = [];
    for (const t of rawTags) tags.push(await ensureTag(t));
    return db.mediaItems.add({
      ...item,
      tags,
      year: item.year ?? parsed.year,
      resolution: item.resolution ?? parsed.resolution,
      addedAt: new Date(),
    });
  }

  async function bulkAddMedia(items: Omit<MediaItem, 'id' | 'addedAt'>[]): Promise<void> {
    const toAdd: MediaItem[] = [];
    for (const item of items) {
      const parsed = parseFilename(item.filename);
      const rawTags = [...new Set([...(item.tags || []), ...parsed.tags])];
      const tags: string[] = [];
      for (const t of rawTags) tags.push(await ensureTag(t));
      toAdd.push({
        ...item,
        tags,
        year: item.year ?? parsed.year,
        resolution: item.resolution ?? parsed.resolution,
        addedAt: new Date(),
      });
    }
    await db.mediaItems.bulkAdd(toAdd);
  }

  async function addTagToItems(ids: number[], tagName: string, category?: string) {
    const canonical = await ensureTag(tagName, category);
    await db.mediaItems.where('id').anyOf(ids).modify(item => {
      if (!item.tags.some(t => t.toLowerCase() === canonical.toLowerCase())) {
        item.tags.push(canonical);
      }
    });
  }

  async function removeTagFromItems(ids: number[], tagName: string) {
    await db.mediaItems.where('id').anyOf(ids).modify(item => {
      item.tags = item.tags.filter(t => t !== tagName);
    });
  }

  async function updateMediaItem(id: number, changes: Partial<MediaItem>) {
    await db.mediaItems.update(id, changes);
  }

  async function renameTag(oldName: string, newName: string) {
    await db.tags.where('name').equals(oldName).modify({ name: newName });
    await db.mediaItems.where('tags').equals(oldName).modify(item => {
      item.tags = item.tags.map(t => t === oldName ? newName : t);
    });
  }

  async function mergeTags(sourceNames: string[], targetName: string) {
    await ensureTag(targetName);
    for (const src of sourceNames) {
      if (src === targetName) continue;
      await db.mediaItems.where('tags').equals(src).modify(item => {
        item.tags = item.tags.filter(t => t !== src);
        if (!item.tags.includes(targetName)) item.tags.push(targetName);
      });
      await db.tags.where('name').equals(src).delete();
    }
  }

  async function deleteTags(names: string[]) {
    for (const name of names) {
      await db.mediaItems.where('tags').equals(name).modify(item => {
        item.tags = item.tags.filter(t => t !== name);
      });
      await db.tags.where('name').equals(name).delete();
    }
  }

  async function deleteMedia(ids: number[]) {
    await db.mediaItems.where('id').anyOf(ids).delete();
  }

  async function addCategory(key: string, label: string, emoji: string, color: string) {
    const existing = await db.tagCategories.where('key').equals(key).first();
    if (existing) return;
    await db.tagCategories.add({ key, label, emoji, color, builtIn: false });
  }

  async function deleteCategory(key: string) {
    // Move all tags in this category to 'custom'
    await db.tags.where('category').equals(key).modify({ category: 'custom' });
    await db.tagCategories.where('key').equals(key).delete();
  }

  async function changeTagCategory(tagName: string, newCategory: string) {
    const catDef = await db.tagCategories.where('key').equals(newCategory).first();
    const color = catDef?.color ?? '270 60% 55%';
    await db.tags.where('name').equals(tagName).modify({ category: newCategory, color });
  }

  return {
    allMedia, allTags, allCategories,
    addMedia, bulkAddMedia, addTagToItems, removeTagFromItems,
    updateMediaItem, renameTag, mergeTags, deleteTags, deleteMedia,
    addCategory, deleteCategory, changeTagCategory,
  };
}
