import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileJson, FolderOpen, Film } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface ImportItem {
  filename: string;
  path: string;
  tags?: string[];
  year?: number;
  resolution?: string;
  rating?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (items: ImportItem[]) => Promise<void>;
}

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.rmvb', '.rm', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.ts', '.m2ts'];

function isVideo(name: string) {
  const lower = name.toLowerCase();
  return VIDEO_EXTS.some(ext => lower.endsWith(ext));
}

export function ImportDialog({ open, onClose, onImport }: Props) {
  const [importing, setImporting] = useState(false);

  // JSON state
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [jsonData, setJsonData] = useState<ImportItem[] | null>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  // Folder state
  const [folderItems, setFolderItems] = useState<ImportItem[] | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const folderRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setJsonData(null); setJsonPreview('');
    setFolderItems(null); setFolderName('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!Array.isArray(json)) throw new Error('JSON 必须为数组');
        setJsonData(json);
        setJsonPreview(`发现 ${json.length} 条记录`);
      } catch (err: any) {
        toast.error('JSON 解析失败: ' + err.message);
        setJsonData(null);
        setJsonPreview('');
      }
    };
    reader.readAsText(file);
  };

  const handleFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const items: ImportItem[] = [];
    let root = '';
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!isVideo(f.name)) continue;
      // webkitRelativePath: "rootFolder/sub/file.mkv"
      const relPath = (f as any).webkitRelativePath || f.name;
      if (!root) root = relPath.split('/')[0];
      items.push({
        filename: f.name,
        path: '/' + relPath,
        tags: [],
      });
    }
    if (items.length === 0) {
      toast.error('未找到任何视频文件');
      return;
    }
    setFolderName(root);
    setFolderItems(items);
  };

  const doImport = async (items: ImportItem[]) => {
    setImporting(true);
    try {
      await onImport(items);
      toast.success(`成功导入 ${items.length} 条记录`);
      handleClose();
    } catch (err: any) {
      toast.error('导入失败: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Upload className="h-5 w-5" />
            导入媒体
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="folder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="folder">
              <FolderOpen className="h-4 w-4 mr-1.5" />扫描文件夹
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="h-4 w-4 mr-1.5" />JSON 高级
            </TabsTrigger>
          </TabsList>

          {/* Folder scan */}
          <TabsContent value="folder" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              选择本地文件夹，自动扫描所有视频文件并解析年份、分辨率。
            </p>
            <p className="text-xs text-muted-foreground">
              支持格式：{VIDEO_EXTS.join(' / ')}
            </p>
            <input
              ref={folderRef}
              type="file"
              // @ts-ignore - webkitdirectory is non-standard
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolder}
              className="hidden"
            />
            <Button variant="outline" className="w-full" onClick={() => folderRef.current?.click()}>
              <FolderOpen className="h-4 w-4 mr-2" />选择文件夹
            </Button>

            {folderItems && (
              <div className="space-y-3">
                <div className="text-sm bg-muted/40 rounded-md p-3 border border-border">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Film className="h-4 w-4" />
                    {folderName} · 找到 {folderItems.length} 个视频
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-0.5 font-mono">
                    {folderItems.slice(0, 8).map((it, i) => (
                      <div key={i} className="truncate">{it.filename}</div>
                    ))}
                    {folderItems.length > 8 && <div>... 还有 {folderItems.length - 8} 个</div>}
                  </div>
                </div>
                <Button className="w-full" onClick={() => doImport(folderItems)} disabled={importing}>
                  {importing ? '导入中...' : `导入 ${folderItems.length} 个视频`}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* JSON */}
          <TabsContent value="json" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              预期格式：<code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                {'[{filename, path, tags?, year?, resolution?, rating?}]'}
              </code>
            </p>
            <input ref={jsonRef} type="file" accept=".json" onChange={handleJsonFile} className="hidden" />
            <Button variant="outline" className="w-full" onClick={() => jsonRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />选择 JSON 文件
            </Button>
            {jsonPreview && <p className="text-sm text-primary font-medium">{jsonPreview}</p>}
            {jsonData && (
              <Button className="w-full" onClick={() => doImport(jsonData)} disabled={importing}>
                {importing ? '导入中...' : `导入 ${jsonData.length} 条记录`}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
