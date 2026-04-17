import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MediaItem, type Tag, type TagCategoryDef, seedDefaultTags } from '@/lib/db';
import { parseFilename, getTagCategoryForName } from '@/lib/filename-parser';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';

export function useMediaStore() {
  // 初始化默认标签
  useEffect(() => {
    const initializeData = async () => {
      // 总是初始化本地默认标签，确保在API不可用时能正常工作
      await seedDefaultTags();
      
      // 如果API可用，也初始化API端的默认数据
      try {
        const available = await api.healthCheck();
        if (available) {
          await api.seedDefaultData();
        }
      } catch (error) {
        console.log('API seed failed, using local data');
      }
    };
    
    initializeData();
  }, []);

  // 本地存储数据
  const localMedia = useLiveQuery(() => db.mediaItems.toArray()) ?? [];
  const localTags = useLiveQuery(() => db.tags.toArray()) ?? [];
  const localCategories = useLiveQuery(() => db.tagCategories.toArray()) ?? [];

  // API数据
  const [apiMedia, setApiMedia] = useState<MediaItem[]>([]);
  const [apiTags, setApiTags] = useState<Tag[]>([]);
  const [apiCategories, setApiCategories] = useState<TagCategoryDef[]>([]);

  // 状态管理
  const [useApi, setUseApi] = useState<boolean>(false);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 检查API是否可用并加载数据
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const available = await api.healthCheck();
        setApiAvailable(available);
        
        if (available) {
          setUseApi(true);
          // 加载API数据
          await loadApiData();
        } else {
          setUseApi(false);
        }
      } catch (error) {
        console.log('API not available, falling back to local storage');
        setApiAvailable(false);
        setUseApi(false);
      }
    };

    checkApiAvailability();
  }, []);

  // 加载API数据
  const loadApiData = async () => {
    if (!useApi) return;
    
    setLoading(true);
    try {
      // 并行加载所有数据
      const [media, tags, categories] = await Promise.all([
        api.getMediaItems(),
        api.getTags(),
        api.getCategories()
      ]);
      
      setApiMedia(media);
      setApiTags(tags);
      setApiCategories(categories);
      setError(null);
    } catch (error) {
      console.error('Error loading API data:', error);
      setError('Failed to load data from API');
      // 回退到本地存储
      setUseApi(false);
    } finally {
      setLoading(false);
    }
  };

  // 当useApi状态变化时加载数据
  useEffect(() => {
    if (useApi) {
      loadApiData();
    }
  }, [useApi]);

  // 获取数据
  const allMedia = useApi ? apiMedia : localMedia;
  const allTags = useApi ? apiTags : localTags;
  const allCategories = useApi ? apiCategories : localCategories;

  /** Find existing tag by case-insensitive match */
  async function findTagCaseInsensitive(name: string): Promise<Tag | undefined> {
    if (useApi) {
      try {
        const tags = allTags;
        const exact = tags.find((t: Tag) => t.name === name);
        if (exact) return exact;
        // Fallback: scan for case-insensitive match
        const lower = name.toLowerCase();
        return tags.find((t: Tag) => t.name.toLowerCase() === lower);
      } catch (error) {
        console.error('Error finding tag:', error);
        // 回退到本地存储
        const exact = await db.tags.where('name').equals(name).first();
        if (exact) return exact;
        // Fallback: scan for case-insensitive match
        const lower = name.toLowerCase();
        const all = await db.tags.toArray();
        return all.find(t => t.name.toLowerCase() === lower);
      }
    } else {
      const exact = await db.tags.where('name').equals(name).first();
      if (exact) return exact;
      // Fallback: scan for case-insensitive match
      const lower = name.toLowerCase();
      const all = await db.tags.toArray();
      return all.find(t => t.name.toLowerCase() === lower);
    }
  }

  async function ensureTag(name: string, categoryHint?: string): Promise<string> {
    if (useApi) {
      try {
        const existing = await findTagCaseInsensitive(name);
        if (existing) return existing.name; // return canonical name
        
        const cat = categoryHint ?? getTagCategoryForName(name).category;
        const catDef = allCategories.find((c: TagCategoryDef) => c.key === cat);
        const color = catDef?.color ?? '270 60% 55%';
        
        await api.createTag({ name, category: cat, color });
        // 重新加载标签数据
        await loadApiData();
        return name;
      } catch (error) {
        console.error('Error ensuring tag:', error);
        // 回退到本地存储
        const existing = await findTagCaseInsensitive(name);
        if (existing) return existing.name; // return canonical name
        const cat = categoryHint ?? getTagCategoryForName(name).category;
        const catDef = await db.tagCategories.where('key').equals(cat).first();
        const color = catDef?.color ?? '270 60% 55%';
        await db.tags.add({ name, category: cat, color });
        return name;
      }
    } else {
      const existing = await findTagCaseInsensitive(name);
      if (existing) return existing.name; // return canonical name
      const cat = categoryHint ?? getTagCategoryForName(name).category;
      const catDef = await db.tagCategories.where('key').equals(cat).first();
      const color = catDef?.color ?? '270 60% 55%';
      await db.tags.add({ name, category: cat, color });
      return name;
    }
  }

  async function addMedia(item: Omit<MediaItem, 'id' | 'addedAt'>): Promise<number> {
    if (useApi) {
      try {
        const parsed = parseFilename(item.filename);
        const rawTags = [...new Set([...item.tags, ...parsed.tags])];
        const tags: string[] = [];
        for (const t of rawTags) tags.push(await ensureTag(t));
        
        const mediaData = {
          ...item,
          tags,
          year: item.year ?? parsed.year,
          resolution: item.resolution ?? parsed.resolution,
        };
        
        await api.bulkCreateMediaItems([mediaData]);
        // 重新加载媒体数据
        await loadApiData();
        // 由于批量创建不返回ID，返回0
        return 0;
      } catch (error) {
        console.error('Error adding media:', error);
        // 回退到本地存储
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
    } else {
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
  }

  async function bulkAddMedia(items: Omit<MediaItem, 'id' | 'addedAt'>[]): Promise<void> {
    if (useApi) {
      try {
        const processedItems = [];
        for (const item of items) {
          const parsed = parseFilename(item.filename);
          const rawTags = [...new Set([...(item.tags || []), ...parsed.tags])];
          const tags: string[] = [];
          for (const t of rawTags) tags.push(await ensureTag(t));
          processedItems.push({
            ...item,
            tags,
            year: item.year ?? parsed.year,
            resolution: item.resolution ?? parsed.resolution,
          });
        }
        await api.bulkCreateMediaItems(processedItems);
        // 重新加载媒体数据
        await loadApiData();
      } catch (error) {
        console.error('Error bulk adding media:', error);
        // 回退到本地存储
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
    } else {
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
  }

  async function addTagToItems(ids: number[], tagName: string, category?: string) {
    if (useApi) {
      try {
        await api.addTagToItems(ids, tagName, category);
        // 立即更新本地状态
        setApiMedia(prev => prev.map(item => {
          if (ids.includes(item.id) && !item.tags.includes(tagName)) {
            return {
              ...item,
              tags: [...item.tags, tagName]
            };
          }
          return item;
        }));
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error adding tag to items:', error);
        // 回退到本地存储
        const canonical = await ensureTag(tagName, category);
        await db.mediaItems.where('id').anyOf(ids).modify(item => {
          if (!item.tags.some(t => t.toLowerCase() === canonical.toLowerCase())) {
            item.tags.push(canonical);
          }
        });
      }
    } else {
      const canonical = await ensureTag(tagName, category);
      await db.mediaItems.where('id').anyOf(ids).modify(item => {
        if (!item.tags.some(t => t.toLowerCase() === canonical.toLowerCase())) {
          item.tags.push(canonical);
        }
      });
    }
  }

  async function removeTagFromItems(ids: number[], tagName: string) {
    if (useApi) {
      try {
        await api.removeTagFromItems(ids, tagName);
        // 立即更新本地状态
        setApiMedia(prev => prev.map(item => {
          if (ids.includes(item.id)) {
            return {
              ...item,
              tags: item.tags.filter(t => t !== tagName)
            };
          }
          return item;
        }));
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error removing tag from items:', error);
        // 回退到本地存储
        await db.mediaItems.where('id').anyOf(ids).modify(item => {
          item.tags = item.tags.filter(t => t !== tagName);
        });
      }
    } else {
      await db.mediaItems.where('id').anyOf(ids).modify(item => {
        item.tags = item.tags.filter(t => t !== tagName);
      });
    }
  }

  async function updateMediaItem(id: number, changes: Partial<MediaItem>) {
    if (useApi) {
      try {
        await api.updateMediaItem(id, changes);
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error updating media item:', error);
        // 回退到本地存储
        await db.mediaItems.update(id, changes);
      }
    } else {
      await db.mediaItems.update(id, changes);
    }
  }

  async function renameTag(oldName: string, newName: string) {
    if (useApi) {
      try {
        await api.renameTag(oldName, newName);
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error renaming tag:', error);
        // 回退到本地存储
        await db.tags.where('name').equals(oldName).modify({ name: newName });
        await db.mediaItems.where('tags').equals(oldName).modify(item => {
          item.tags = item.tags.map(t => t === oldName ? newName : t);
        });
      }
    } else {
      await db.tags.where('name').equals(oldName).modify({ name: newName });
      await db.mediaItems.where('tags').equals(oldName).modify(item => {
        item.tags = item.tags.map(t => t === oldName ? newName : t);
      });
    }
  }

  async function mergeTags(sourceNames: string[], targetName: string) {
    if (useApi) {
      try {
        await api.mergeTags(sourceNames, targetName);
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error merging tags:', error);
        // 回退到本地存储
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
    } else {
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
  }

  async function deleteTags(names: string[]) {
    if (useApi) {
      try {
        await api.bulkDeleteTags(names);
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error deleting tags:', error);
        // 回退到本地存储
        for (const name of names) {
          await db.mediaItems.where('tags').equals(name).modify(item => {
            item.tags = item.tags.filter(t => t !== name);
          });
          await db.tags.where('name').equals(name).delete();
        }
      }
    } else {
      for (const name of names) {
        await db.mediaItems.where('tags').equals(name).modify(item => {
          item.tags = item.tags.filter(t => t !== name);
        });
        await db.tags.where('name').equals(name).delete();
      }
    }
  }

  async function deleteMedia(ids: number[]) {
    if (useApi) {
      try {
        await api.bulkDeleteMediaItems(ids);
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error deleting media:', error);
        // 回退到本地存储
        await db.mediaItems.where('id').anyOf(ids).delete();
      }
    } else {
      await db.mediaItems.where('id').anyOf(ids).delete();
    }
  }

  async function addCategory(key: string, label: string, emoji: string, color: string) {
    if (useApi) {
      try {
        await api.createCategory({ key, label, emoji, color });
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error adding category:', error);
        // 回退到本地存储
        const existing = await db.tagCategories.where('key').equals(key).first();
        if (existing) return;
        await db.tagCategories.add({ key, label, emoji, color, builtIn: false });
      }
    } else {
      const existing = await db.tagCategories.where('key').equals(key).first();
      if (existing) return;
      await db.tagCategories.add({ key, label, emoji, color, builtIn: false });
    }
  }

  async function deleteCategory(key: string) {
    if (useApi) {
      try {
        // 找到分类ID
        const category = allCategories.find((c: TagCategoryDef) => c.key === key);
        if (category && 'id' in category) {
          await api.deleteCategory(category.id);
          // 重新加载数据
          await loadApiData();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        // 回退到本地存储
        await db.tags.where('category').equals(key).modify({ category: 'custom' });
        await db.tagCategories.where('key').equals(key).delete();
      }
    } else {
      await db.tags.where('category').equals(key).modify({ category: 'custom' });
      await db.tagCategories.where('key').equals(key).delete();
    }
  }

  async function changeTagCategory(tagName: string, newCategory: string) {
    if (useApi) {
      try {
        await api.changeTagCategory(tagName, newCategory);
        // 重新加载数据
        await loadApiData();
      } catch (error) {
        console.error('Error changing tag category:', error);
        // 回退到本地存储
        const catDef = await db.tagCategories.where('key').equals(newCategory).first();
        const color = catDef?.color ?? '270 60% 55%';
        await db.tags.where('name').equals(tagName).modify({ category: newCategory, color });
      }
    } else {
      const catDef = await db.tagCategories.where('key').equals(newCategory).first();
      const color = catDef?.color ?? '270 60% 55%';
      await db.tags.where('name').equals(tagName).modify({ category: newCategory, color });
    }
  }

  // 切换API模式
  const toggleApiMode = useCallback(async () => {
    if (!useApi) {
      const available = await api.healthCheck();
      if (available) {
        setUseApi(true);
        setApiAvailable(true);
      } else {
        setError('API is not available');
      }
    } else {
      setUseApi(false);
    }
  }, [useApi]);

  return {
    allMedia, allTags, allCategories,
    addMedia, bulkAddMedia, addTagToItems, removeTagFromItems,
    updateMediaItem, renameTag, mergeTags, deleteTags, deleteMedia,
    addCategory, deleteCategory, changeTagCategory,
    // 新增状态和方法
    useApi, apiAvailable, loading, error,
    toggleApiMode,
    // 加载数据方法
    loadApiData,
  };
}
