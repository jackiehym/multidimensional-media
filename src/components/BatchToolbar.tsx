import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  count: number;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BatchToolbar({ count, onAddTag, onRemoveTag, onDelete, onClear }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [mode, setMode] = useState<'add' | 'remove' | null>(null);

  if (count === 0) return null;

  const handleSubmit = () => {
    if (!tagInput.trim() || !mode) return;
    if (mode === 'add') onAddTag(tagInput.trim());
    else onRemoveTag(tagInput.trim());
    setTagInput('');
    setMode(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-2xl shadow-primary/10 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium text-primary">{count} 项已选</span>
      
      {mode ? (
        <div className="flex gap-2">
          <Input
            className="h-8 w-40 text-sm"
            placeholder={mode === 'add' ? '输入标签名...' : '输入要移除的标签...'}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <Button size="sm" onClick={handleSubmit}>确认</Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(null)}>取消</Button>
        </div>
      ) : (
        <>
          <Button size="sm" variant="secondary" onClick={() => setMode('add')}>
            <Plus className="h-3 w-3 mr-1" />添加标签
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setMode('remove')}>
            <Minus className="h-3 w-3 mr-1" />移除标签
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3 mr-1" />删除
          </Button>
        </>
      )}
      
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
