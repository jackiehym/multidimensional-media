import { useState } from 'react';
import { useMediaStore } from '@/hooks/useMediaStore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type Tag, type TagCategoryDef } from '@/lib/db';
import { Pencil, Merge, Trash2, Tags, Plus, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function TagsPage() {
  const store = useMediaStore();
  const [renaming, setRenaming] = useState<Tag | null>(null);
  const [newName, setNewName] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeSelected, setMergeSelected] = useState<string[]>([]);
  const [mergeTarget, setMergeTarget] = useState('');
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [changingCategory, setChangingCategory] = useState<Tag | null>(null);
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('200 60% 50%');

  const tagCounts = new Map<string, number>();
  store.allMedia.forEach(m => m.tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));

  const categoryOrder = store.allCategories.length > 0
    ? store.allCategories.map(c => c.key)
    : ['genre', 'quality', 'year', 'custom'];

  const categoryLabels = new Map(store.allCategories.map(c => [c.key, `${c.emoji} ${c.label}`]));

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

  const handleChangeCategory = async () => {
    if (!changingCategory || !newCategoryKey) return;
    await store.changeTagCategory(changingCategory.name, newCategoryKey);
    toast.success(`标签 "${changingCategory.name}" 已移至 ${categoryLabels.get(newCategoryKey) ?? newCategoryKey}`);
    setChangingCategory(null);
  };

  const handleAddCategory = async () => {
    if (!newCatKey.trim() || !newCatLabel.trim()) return;
    await store.addCategory(newCatKey.trim(), newCatLabel.trim(), newCatEmoji, newCatColor);
    toast.success(`已添加分类: ${newCatEmoji} ${newCatLabel.trim()}`);
    setAddingCategory(false);
    setNewCatKey('');
    setNewCatLabel('');
    setNewCatEmoji('📁');
    setNewCatColor('200 60% 50%');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-14 flex items-center gap-3 border-b border-border px-4 shrink-0 bg-card/50 backdrop-blur">
        <SidebarTrigger />
        <Tags className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">标签管理</h1>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setAddingCategory(true)}>
          <FolderPlus className="h-4 w-4 mr-1" />添加分类
        </Button>
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
          {categoryOrder.map(catKey => {
            const catTags = store.allTags.filter(t => t.category === catKey);
            const catDef = store.allCategories.find(c => c.key === catKey);
            if (catTags.length === 0 && catDef?.builtIn) return null;
            return (
              <div key={catKey}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {categoryLabels.get(catKey) ?? catKey} ({catTags.length})
                  </h2>
                  {catDef && !catDef.builtIn && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 text-[10px] text-destructive"
                      onClick={async () => {
                        await store.deleteCategory(catKey);
                        toast.success(`已删除分类 "${catDef.label}"`);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
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
                        onClick={() => { setChangingCategory(tag); setNewCategoryKey(tag.category); }}
                        title="修改分类"
                      >
                        <FolderPlus className="h-3 w-3" />
                      </Button>
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
                  {catTags.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-2">暂无标签</p>
                  )}
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

      {/* Change category dialog */}
      <Dialog open={!!changingCategory} onOpenChange={v => !v && setChangingCategory(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">修改标签分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              标签: <TagBadge name={changingCategory?.name ?? ''} category={changingCategory?.category} />
            </p>
            <Select value={newCategoryKey} onValueChange={setNewCategoryKey}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {store.allCategories.map(c => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleChangeCategory}>确认修改</Button>
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

      {/* Add category dialog */}
      <Dialog open={addingCategory} onOpenChange={v => !v && setAddingCategory(false)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">添加标签分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">分类标识（英文，如 country）</label>
              <Input
                value={newCatKey}
                onChange={e => setNewCatKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="country"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">显示名称</label>
              <Input
                value={newCatLabel}
                onChange={e => setNewCatLabel(e.target.value)}
                placeholder="国家/地区"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">图标 Emoji</label>
                <Input
                  value={newCatEmoji}
                  onChange={e => setNewCatEmoji(e.target.value)}
                  placeholder="🌍"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">颜色 (HSL)</label>
                <Input
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  placeholder="200 60% 50%"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAddCategory}
              disabled={!newCatKey.trim() || !newCatLabel.trim()}
            >
              添加分类
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
