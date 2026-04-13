import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileJson } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (items: Array<{ filename: string; path: string; tags?: string[]; year?: number; resolution?: string; rating?: number }>) => Promise<void>;
}

export function ImportDialog({ open, onClose, onImport }: Props) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [data, setData] = useState<any[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!Array.isArray(json)) throw new Error('JSON 必须为数组');
        setData(json);
        setPreview(`发现 ${json.length} 条记录`);
      } catch (err: any) {
        toast.error('JSON 解析失败: ' + err.message);
        setData(null);
        setPreview('');
      }
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!data) return;
    setImporting(true);
    try {
      await onImport(data.map(d => ({
        filename: d.filename || d.name || 'unknown',
        path: d.path || d.filepath || '/',
        tags: d.tags || [],
        year: d.year,
        resolution: d.resolution,
        rating: d.rating,
      })));
      toast.success(`成功导入 ${data.length} 条记录`);
      onClose();
      setData(null);
      setPreview('');
    } catch (err: any) {
      toast.error('导入失败: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileJson className="h-5 w-5" />
            导入 JSON
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            预期格式：<code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
              {'[{filename, path, tags?, year?, resolution?, rating?}]'}
            </code>
          </p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />选择 JSON 文件
          </Button>
          {preview && <p className="text-sm text-primary font-medium">{preview}</p>}
          {data && (
            <Button className="w-full" onClick={doImport} disabled={importing}>
              {importing ? '导入中...' : `导入 ${data.length} 条记录`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
