import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, FilePlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { MediaItem } from '@/lib/db';
import { parseFilename } from '@/lib/filename-parser';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<MediaItem, 'id' | 'addedAt'>) => Promise<number>;
}

export function AddMediaDialog({ open, onClose, onAdd }: Props) {
  const [filename, setFilename] = useState('');
  const [path, setPath] = useState('');
  const [year, setYear] = useState<string>('');
  const [resolution, setResolution] = useState('');
  const [rating, setRating] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Auto-parse from filename
  useEffect(() => {
    if (!filename) return;
    const parsed = parseFilename(filename);
    if (parsed.year && !year) setYear(String(parsed.year));
    if (parsed.resolution && !resolution) setResolution(parsed.resolution);
  }, [filename]);

  const reset = () => {
    setFilename(''); setPath(''); setYear(''); setResolution('');
    setRating(''); setTagInput(''); setTags([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.some(x => x.toLowerCase() === t.toLowerCase())) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handleSave = async () => {
    if (!filename.trim()) { toast.error('文件名不能为空'); return; }
    setSaving(true);
    try {
      await onAdd({
        filename: filename.trim(),
        path: path.trim() || `/media/${filename.trim()}`,
        tags,
        year: year ? parseInt(year, 10) : undefined,
        resolution: resolution.trim() || undefined,
        rating: rating ? parseFloat(rating) : undefined,
      });
      toast.success('已添加媒体');
      handleClose();
    } catch (err: any) {
      toast.error('添加失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FilePlus className="h-5 w-5" />
            添加媒体
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="fn" className="text-xs text-muted-foreground">文件名 *</Label>
            <Input
              id="fn"
              placeholder="Inception.2010.2160p.mkv"
              value={filename}
              onChange={e => setFilename(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground mt-1">将自动解析年份和分辨率</p>
          </div>

          <div>
            <Label htmlFor="path" className="text-xs text-muted-foreground">路径</Label>
            <Input
              id="path"
              placeholder="/media/movies/..."
              value={path}
              onChange={e => setPath(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">年份</Label>
              <Input type="number" placeholder="2010" value={year} onChange={e => setYear(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">分辨率</Label>
              <Input placeholder="4K" value={resolution} onChange={e => setResolution(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">评分</Label>
              <Input type="number" step="0.1" placeholder="8.5" value={rating} onChange={e => setRating(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">标签</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签按回车添加"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <Button type="button" size="sm" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted border border-border"
                  >
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleSave} disabled={saving || !filename.trim()}>
              {saving ? '保存中...' : '添加'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
