import { useEffect, useRef } from 'react';
import { Plus, Minus, Info, Trash2 } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onAddTag: () => void;
  onRemoveTag: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
}

export function ContextMenu({ x, y, onClose, onAddTag, onRemoveTag, onViewDetail, onDelete }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { icon: Plus, label: '添加标签', action: onAddTag },
    { icon: Minus, label: '移除标签', action: onRemoveTag },
    { icon: Info, label: '查看详情', action: onViewDetail },
    { icon: Trash2, label: '删除', action: onDelete, destructive: true },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[100] bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in zoom-in-95"
      style={{ left: x, top: y }}
    >
      {items.map(item => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${
            item.destructive ? 'text-destructive' : 'text-popover-foreground'
          }`}
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
