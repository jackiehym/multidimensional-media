import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MediaItem, type Tag, seedDefaultTags } from '@/lib/db';
import { parseFilename, getTagCategoryForName } from '@/lib/filename-parser';
import { useEffect } from 'react';

export function useMediaStore() {
  useEffect(() => { seedDefaultTags(); }, []);

  const allMedia = useLiveQuery(() => db.mediaItems.toArray()) ?? [];
  const allTags = useLiveQuery(() => db.tags.toArray()) ?? [];

  async function ensureTag(name: string): Promise<void> {
    const existing = await db.tags.where('name').equals(name).first();
    if (!existing) {
      const { category, color } = getTagCategoryForName(name);
      await db.tags.add({ name, category, color });
    }
  }

  async function addMedia(item: Omit<MediaItem, 'id' | 'addedAt'>): Promise<number> {
    const parsed = parseFilename(item.filename);
    const tags = [...new Set([...item.tags, ...parsed.tags])];
    for (const t of tags) await ensureTag(t);
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
      const tags = [...new Set([...(item.tags || []), ...parsed.tags])];
      for (const t of tags) await ensureTag(t);
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

  async function addTagToItems(ids: number[], tagName: string) {
    await ensureTag(tagName);
    await db.mediaItems.where('id').anyOf(ids).modify(item => {
      if (!item.tags.includes(tagName)) item.tags.push(tagName);
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

  return {
    allMedia, allTags,
    addMedia, bulkAddMedia, addTagToItems, removeTagFromItems,
    updateMediaItem, renameTag, mergeTags, deleteTags, deleteMedia,
  };
}
