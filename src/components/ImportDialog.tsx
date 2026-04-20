import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileJson, FolderOpen, Film, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface ImportItem {
  filename: string;
  path: string;
  tags?: string[];
  year?: number;
  resolution?: string;
  rating?: number;
  display_name?: string;  // 显示文件名
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imported, setImported] = useState(false);  // 标记是否已导入



  // Folder state
  const [folderItems, setFolderItems] = useState<ImportItem[] | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const folderRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [uploadItems, setUploadItems] = useState<ImportItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = async () => {
    // 只有未导入的文件才删除
    if (!imported) {
      // 如果有未导入的文件，删除它们
      if (uploadItems && uploadItems.length > 0) {
        try {
          for (const item of uploadItems) {
            const filename = item.path.split('/').pop();
            if (filename) {
              await api.deleteFile(filename).catch(console.error);
            }
          }
        } catch (err) {
          console.error('清理未导入的文件失败:', err);
        }
      }
      
      if (folderItems && folderItems.length > 0) {
        try {
          for (const item of folderItems) {
            const filename = item.path.split('/').pop();
            if (filename) {
              await api.deleteFile(filename).catch(console.error);
            }
          }
        } catch (err) {
          console.error('清理未导入的文件失败:', err);
        }
      }
    }
    
    setFolderItems(null); setFolderName('');
    setUploadItems(null);
    setUploadProgress(0);
    setImported(false);
  };

  const handleClose = async () => { await reset(); onClose(); };

  const handleFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    console.log(files);
    
    const videoFiles = Array.from(files).filter(f => isVideo(f.name));
    if (videoFiles.length === 0) {
      toast.error('未找到任何视频文件');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedItems: ImportItem[] = [];
      let root = '';
      
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        const response = await api.uploadFile(file);
        
        uploadedItems.push({
          filename: response.filename,  // 存储文件名（带 UUID）
          path: response.path,
          tags: [],
          display_name: response.display_filename,  // 显示文件名（原始文件名）
        });
        
        if (!root) {
          // webkitRelativePath: "rootFolder/sub/file.mkv"
          const relPath = (file as any).webkitRelativePath || file.name;
          root = relPath.split('/')[0];
        }
        
        setUploadProgress(Math.round((i + 1) / videoFiles.length * 100));
      }
      
      setFolderName(root || '上传的文件');
      setFolderItems(uploadedItems);
      toast.success(`成功上传 ${uploadedItems.length} 个文件`);
    } catch (error) {
      toast.error('上传失败: ' + (error as Error).message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const videoFiles = Array.from(files).filter(f => isVideo(f.name));
    if (videoFiles.length === 0) {
      toast.error('未找到任何视频文件');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedItems: ImportItem[] = [];
      
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        const response = await api.uploadFile(file);
        
        uploadedItems.push({
          filename: response.filename,  // 存储文件名（带 UUID）
          path: response.path,
          tags: [],
          display_name: response.display_filename,  // 显示文件名（原始文件名）
        });
        
        setUploadProgress(Math.round((i + 1) / videoFiles.length * 100));
      }
      
      setUploadItems(uploadedItems);
      toast.success(`成功上传 ${uploadedItems.length} 个文件`);
    } catch (error) {
      toast.error('上传失败: ' + (error as Error).message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const doImport = async (items: ImportItem[]) => {
    setImporting(true);
    try {
      await onImport(items);
      toast.success(`成功导入 ${items.length} 条记录`);
      setImported(true);  // 标记已导入
      setUploadItems(null);  // 清空上传列表
      setFolderItems(null);  // 清空文件夹列表
      onClose();  // 直接关闭，不执行清理（因为已导入）
    } catch (err: any) {
      toast.error('导入失败：' + err.message);
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

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-1.5" />上传文件
            </TabsTrigger>
            <TabsTrigger value="folder">
              <FolderOpen className="h-4 w-4 mr-1.5" />扫描文件夹
            </TabsTrigger>
          </TabsList>

          {/* File upload */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              上传视频文件到服务器，自动保存到后端媒体库。
            </p>
            <p className="text-xs text-muted-foreground">
              支持格式：{VIDEO_EXTS.join(' / ')}
            </p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={VIDEO_EXTS.map(ext => 'video/*' + ext).join(',')}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />选择视频文件
            </Button>
            
            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  上传中... {uploadProgress}%
                </p>
              </div>
            )}

            {uploadItems && (
              <div className="space-y-3">
                <div className="text-sm bg-muted/40 rounded-md p-3 border border-border">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Film className="h-4 w-4" />
                    已上传 {uploadItems.length} 个视频
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-0.5 font-mono">
                    {uploadItems.slice(0, 8).map((it, i) => (
                      <div key={i} className="truncate">{it.display_name || it.filename}</div>
                    ))}
                    {uploadItems.length > 8 && <div>... 还有 {uploadItems.length - 8} 个</div>}
                  </div>
                </div>
                <Button className="w-full" onClick={() => doImport(uploadItems)} disabled={importing}>
                  {importing ? '导入中...' : `导入 ${uploadItems.length} 个视频`}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Folder scan */}
          <TabsContent value="folder" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              选择本地文件夹，自动上传所有视频文件到服务器。
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
            <Button variant="outline" className="w-full" onClick={() => folderRef.current?.click()} disabled={uploading}>
              <FolderOpen className="h-4 w-4 mr-2" />选择文件夹
            </Button>
            
            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  上传中... {uploadProgress}%
                </p>
              </div>
            )}

            {folderItems && (
              <div className="space-y-3">
                <div className="text-sm bg-muted/40 rounded-md p-3 border border-border">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Film className="h-4 w-4" />
                    {folderName} · 已上传 {folderItems.length} 个视频
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-0.5 font-mono">
                    {folderItems.slice(0, 8).map((it, i) => (
                      <div key={i} className="truncate">{it.display_name || it.filename}</div>
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


        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
