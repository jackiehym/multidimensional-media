import { type MediaItem, type Tag } from '@/lib/db';
import { TagBadge } from './TagBadge';
import { Film, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  item: MediaItem;
  tags: Tag[];
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  compact?: boolean;
}

export function MediaCard({ item, tags, selected, onSelect, onContextMenu, onDoubleClick, compact }: MediaCardProps) {
  const tagMap = new Map(tags.map(t => [t.name, t]));

  if (compact) {
    return (
      <div
        onClick={onSelect}
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors border border-transparent',
          selected ? 'bg-primary/15 border-primary/40' : 'hover:bg-accent/50',
        )}
      >
        <Film className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate flex-1 min-w-0">{item.filename}</span>
        {item.rating && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {item.rating}
          </span>
        )}
        <div className="flex gap-1 shrink-0 flex-wrap max-w-[300px]">
          {item.tags.slice(0, 5).map(t => {
            const tag = tagMap.get(t);
            return <TagBadge key={t} name={t} category={tag?.category} />;
          })}
          {item.tags.length > 5 && <span className="text-xs text-muted-foreground">+{item.tags.length - 5}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      className={cn(
        'group rounded-lg overflow-hidden cursor-pointer transition-all border',
        selected ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border bg-card hover:border-primary/30 hover:shadow-md',
      )}
    >
      <div className="aspect-[2/3] bg-muted/30 flex items-center justify-center relative overflow-hidden">
        <Film className="h-12 w-12 text-muted-foreground/30" />
        {item.resolution && (
          <span className="absolute top-2 right-2 bg-background/80 backdrop-blur text-[10px] font-bold px-1.5 py-0.5 rounded">
            {item.resolution}
          </span>
        )}
        {item.year && (
          <span className="absolute top-2 left-2 bg-background/80 backdrop-blur text-[10px] px-1.5 py-0.5 rounded">
            {item.year}
          </span>
        )}
      </div>
      <div className="p-2 space-y-1.5">
        <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
        {item.rating != null && (
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-[10px] text-muted-foreground">{item.rating}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map(t => {
            const tag = tagMap.get(t);
            return <TagBadge key={t} name={t} category={tag?.category} />;
          })}
          {item.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{item.tags.length - 3}</span>}
        </div>
      </div>
    </div>
  );
}
