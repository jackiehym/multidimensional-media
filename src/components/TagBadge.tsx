import { type TagCategory, TAG_CATEGORY_COLORS } from '@/lib/db';
import { cn } from '@/lib/utils';

const builtInCategoryBg: Record<string, string> = {
  year: 'bg-tag-year/20 text-tag-year border-tag-year/30',
  genre: 'bg-tag-genre/20 text-tag-genre border-tag-genre/30',
  quality: 'bg-tag-quality/20 text-tag-quality border-tag-quality/30',
  custom: 'bg-tag-custom/20 text-tag-custom border-tag-custom/30',
};

interface TagBadgeProps {
  name: string;
  category?: TagCategory;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

export function TagBadge({ name, category = 'custom', onRemove, onClick, active, size = 'sm' }: TagBadgeProps) {
  const bgClass = builtInCategoryBg[category] ?? 'bg-accent/20 text-accent-foreground border-accent/30';

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-all',
        bgClass,
        onClick && 'cursor-pointer hover:brightness-125',
        active && 'ring-1 ring-primary brightness-125',
        size === 'md' && 'px-3 py-1 text-sm',
      )}
    >
      {name}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 hover:text-destructive"
        >
          ×
        </button>
      )}
    </span>
  );
}
