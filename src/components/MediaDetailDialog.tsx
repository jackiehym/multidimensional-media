import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type MediaItem, type Tag } from '@/lib/db';
import { TagBadge } from './TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  item: MediaItem | null;
  tags: Tag[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: number, changes: Partial<MediaItem>) => void;
  onAddTag: (ids: number[], tag: string) => void;
  onRemoveTag: (ids: number[], tag: string) => void;
}

export function MediaDetailDialog({ item, tags, open, onClose, onUpdate, onAddTag, onRemoveTag }: Props) {
  const [newTag, setNewTag] = useState('');
  const [editRating, setEditRating] = useState(false);
  const [ratingVal, setRatingVal] = useState('');
  const tagMap = new Map(tags.map(t => [t.name, t]));

  if (!item) return null;

  const handleAddTag = () => {
    if (newTag.trim() && item.id) {
      onAddTag([item.id], newTag.trim());
      setNewTag('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{item.filename}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">完整路径</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted/50 px-2 py-1 rounded flex-1 truncate font-mono">
                {item.path}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('此功能需配合本地脚本使用。请参阅文档配置 tagflow-open 命令。')}
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                打开位置
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">年份</p>
              <p className="font-medium">{item.year ?? '未知'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">分辨率</p>
              <p className="font-medium">{item.resolution ?? '未知'}</p>
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
                      if (e.key === 'Enter' && item.id) {
                        onUpdate(item.id, { rating: parseFloat(ratingVal) || undefined });
                        setEditRating(false);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  className="flex items-center gap-1 font-medium hover:text-primary"
                  onClick={() => { setEditRating(true); setRatingVal(String(item.rating ?? '')); }}
                >
                  {item.rating != null ? (
                    <><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{item.rating}</>
                  ) : '点击评分'}
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">标签</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.tags.map(t => {
                const tag = tagMap.get(t);
                return (
                  <TagBadge
                    key={t}
                    name={t}
                    category={tag?.category}
                    size="md"
                    onRemove={() => item.id && onRemoveTag([item.id], t)}
                  />
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                className="h-8 text-sm"
                placeholder="添加标签..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              />
              <Button size="sm" onClick={handleAddTag}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            添加于 {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '未知'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
