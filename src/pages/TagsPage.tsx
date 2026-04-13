import { useState } from 'react';
import { useMediaStore } from '@/hooks/useMediaStore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { type Tag, type TagCategory } from '@/lib/db';
import { Pencil, Merge, Trash2, Tags } from 'lucide-react';
import { toast } from 'sonner';

const categoryLabels: Record<TagCategory, string> = {
  year: '年份', genre: '类型', quality: '画质', custom: '自定义',
};

export default function TagsPage() {
  const store = useMediaStore();
  const [renaming, setRenaming] = useState<Tag | null>(null);
  const [newName, setNewName] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeSelected, setMergeSelected] = useState<string[]>([]);
  const [mergeTarget, setMergeTarget] = useState('');
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());

  const tagCounts = new Map<string, number>();
  store.allMedia.forEach(m => m.tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));

  const handleRename = async () => {
    if (!renaming || !newName.trim()) return;
    await store.renameTag(renaming.name, newName.trim());
    toast.success(`标签已重命名: ${renaming.name} → ${newName.trim()}`);
    setRenaming(null);
  };

  const handleMerge = async () => {
    if (mergeSelected.length < 2 || !mergeTarget.trim()) return;
    await store.mergeTags(mergeSelected, mergeTarget.trim());
    toast.success(`已合并 ${mergeSelected.length} 个标签为 "${mergeTarget.trim()}"`);
    setMerging(false);
    setMergeSelected([]);
    setMergeTarget('');
  };

  const handleBatchDelete = async () => {
    if (selectedForDelete.size === 0) return;
    await store.deleteTags([...selectedForDelete]);
    toast.success(`已删除 ${selectedForDelete.size} 个标签`);
    setSelectedForDelete(new Set());
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-14 flex items-center gap-3 border-b border-border px-4 shrink-0 bg-card/50 backdrop-blur">
        <SidebarTrigger />
        <Tags className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">标签管理</h1>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setMerging(true)}>
          <Merge className="h-4 w-4 mr-1" />合并标签
        </Button>
        {selectedForDelete.size > 0 && (
          <Button size="sm" variant="destructive" onClick={handleBatchDelete}>
            <Trash2 className="h-4 w-4 mr-1" />删除 {selectedForDelete.size} 个
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {(['genre', 'quality', 'year', 'custom'] as TagCategory[]).map(cat => {
            const catTags = store.allTags.filter(t => t.category === cat);
            if (catTags.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {categoryLabels[cat]} ({catTags.length})
                </h2>
                <div className="space-y-1">
                  {catTags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 group"
                    >
                      <Checkbox
                        checked={selectedForDelete.has(tag.name)}
                        onCheckedChange={v => {
                          const next = new Set(selectedForDelete);
                          v ? next.add(tag.name) : next.delete(tag.name);
                          setSelectedForDelete(next);
                        }}
                      />
                      <TagBadge name={tag.name} category={tag.category} size="md" />
                      <span className="text-xs text-muted-foreground">
                        {tagCounts.get(tag.name) || 0} 个媒体
                      </span>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => { setRenaming(tag); setNewName(tag.name); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={v => !v && setRenaming(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">重命名标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              当前名称: <TagBadge name={renaming?.name ?? ''} category={renaming?.category} />
            </p>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              placeholder="新标签名..."
            />
            <Button className="w-full" onClick={handleRename}>确认重命名</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge dialog */}
      <Dialog open={merging} onOpenChange={v => !v && setMerging(false)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">合并标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">选择要合并的标签（至少2个），然后输入目标标签名</p>
            <div className="max-h-48 overflow-auto space-y-1">
              {store.allTags.map(tag => (
                <label key={tag.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50 cursor-pointer">
                  <Checkbox
                    checked={mergeSelected.includes(tag.name)}
                    onCheckedChange={v => {
                      setMergeSelected(prev =>
                        v ? [...prev, tag.name] : prev.filter(n => n !== tag.name)
                      );
                    }}
                  />
                  <TagBadge name={tag.name} category={tag.category} />
                  <span className="text-xs text-muted-foreground">{tagCounts.get(tag.name) || 0}</span>
                </label>
              ))}
            </div>
            <Input
              placeholder="合并后的标签名..."
              value={mergeTarget}
              onChange={e => setMergeTarget(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleMerge}
              disabled={mergeSelected.length < 2 || !mergeTarget.trim()}
            >
              合并 {mergeSelected.length} 个标签
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
