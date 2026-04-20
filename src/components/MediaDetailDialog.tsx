import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type MediaItem, type Tag, type TagCategoryDef } from '@/lib/db';
import { TagBadge } from './TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Play, Plus, Star, Info, Tags, Film } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface Props {
  item: MediaItem | null;
  tags: Tag[];
  categories: TagCategoryDef[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: number, changes: Partial<MediaItem>) => void;
  onAddTag: (ids: number[], tag: string, category?: string) => void;
  onRemoveTag: (ids: number[], tag: string) => void;
}

export function MediaDetailDialog({ item, tags, categories, open, onClose, onUpdate, onAddTag, onRemoveTag }: Props) {
  const [newTag, setNewTag] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('custom');
  const [editRating, setEditRating] = useState(false);
  const [ratingVal, setRatingVal] = useState('');
  const [localItem, setLocalItem] = useState<MediaItem | null>(item);
  const tagMap = new Map(tags.map(t => [t.name, t]));

  // 当传入的item变化时更新本地状态
  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  if (!localItem) return null;

  const handleAddTag = () => {
    if (newTag.trim() && localItem.id) {
      const existing = tags.find(t => t.name.toLowerCase() === newTag.trim().toLowerCase());
      onAddTag([localItem.id], newTag.trim(), existing ? undefined : newTagCategory);
      // 立即更新本地状态
      setLocalItem(prev => {
        if (!prev) return null;
        if (!prev.tags.includes(newTag.trim())) {
          return {
            ...prev,
            tags: [...prev.tags, newTag.trim()]
          };
        }
        return prev;
      });
      setNewTag('');
    }
  };

  const handlePlay = async () => {
    try {
      await api.openFile(localItem.path);
      toast.success('正在尝试打开文件...');
    } catch (error) {
      toast.error('打开文件失败，请手动打开：\n' + localItem.path);
    }
  };

  const isNewTag = newTag.trim() && !tags.some(t => t.name.toLowerCase() === newTag.trim().toLowerCase());

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden">
        {/* Player area */}
        <div className="relative bg-black aspect-video flex items-center justify-center group cursor-pointer" onClick={handlePlay}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <Film className="h-20 w-20 text-muted-foreground/20 absolute" />
          <button className="relative z-10 h-16 w-16 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-primary/30">
            <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <p className="text-white font-semibold text-sm truncate">{localItem.display_name || localItem.filename}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
              {localItem.year && <span>{localItem.year}</span>}
              {localItem.resolution && <span>{localItem.resolution}</span>}
              {localItem.rating != null && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{localItem.rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Info & Tags */}
        <Tabs defaultValue="info" className="px-5 pb-5 pt-2">
          <TabsList className="mb-3">
            <TabsTrigger value="info"><Info className="h-3.5 w-3.5 mr-1.5" />详情</TabsTrigger>
            <TabsTrigger value="tags"><Tags className="h-3.5 w-3.5 mr-1.5" />标签</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-0">
            <div>
            <p className="text-xs text-muted-foreground mb-1">完整路径</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted/50 px-2 py-1 rounded flex-1 truncate font-mono">
                {localItem.path}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await api.openLocation(localItem.path);
                    toast.success('已尝试打开文件位置');
                  } catch (error) {
                    toast.error('打开文件位置失败: ' + (error as Error).message);
                  }
                }}
              >
                <FolderOpen className="h-3 w-3 mr-1" />打开位置
              </Button>
            </div>
          </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">年份</p>
                <p className="font-medium">{localItem.year ?? '未知'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">分辨率</p>
                <p className="font-medium">{localItem.resolution ?? '未知'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">评分</p>
                {editRating ? (
                  <div className="flex gap-1">
                    <Input
                      className="h-6 w-16 text-xs"
                      type="number" min="0" max="10" step="0.1"
                      value={ratingVal}
                      onChange={e => setRatingVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && localItem.id) {
                          onUpdate(localItem.id, { rating: parseFloat(ratingVal) || undefined });
                          setEditRating(false);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1 font-medium hover:text-primary"
                    onClick={() => { setEditRating(true); setRatingVal(String(localItem.rating ?? '')); }}
                  >
                    {localItem.rating != null ? (
                      <><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{localItem.rating}</>
                    ) : '点击评分'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {localItem.tags.map(t => {
                const tag = tagMap.get(t);
                return <TagBadge key={t} name={t} category={tag?.category} size="md" />;
              })}
            </div>

            <p className="text-[10px] text-muted-foreground">
              添加于 {localItem.addedAt ? new Date(localItem.addedAt).toLocaleDateString() : '未知'}
            </p>
          </TabsContent>

          <TabsContent value="tags" className="space-y-3 mt-0">
            <div className="flex flex-wrap gap-1.5">
              {localItem.tags.map(t => {
                const tag = tagMap.get(t);
                return (
                  <TagBadge
                    key={t}
                    name={t}
                    category={tag?.category}
                    size="md"
                    onRemove={() => {
                      if (localItem.id) {
                        onRemoveTag([localItem.id], t);
                        // 立即更新本地状态
                        setLocalItem(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            tags: prev.tags.filter(tag => tag !== t)
                          };
                        });
                      }
                    }}
                  />
                );
              })}
              {localItem.tags.length === 0 && <p className="text-xs text-muted-foreground">暂无标签</p>}
            </div>
            <div className="flex gap-2">
              <Input
                className="h-8 text-sm flex-1"
                placeholder="添加标签..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              />
              {isNewTag && (
                <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" onClick={handleAddTag}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
