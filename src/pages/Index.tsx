import { useState, useCallback, useMemo, useRef } from 'react';

import { Search, Grid3X3, List, Upload, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMediaStore } from '@/hooks/useMediaStore';
import { parseSearch } from '@/lib/search-parser';
import { MediaCard } from '@/components/MediaCard';
import { MediaDetailDialog } from '@/components/MediaDetailDialog';
import { BatchToolbar } from '@/components/BatchToolbar';
import { ImportDialog } from '@/components/ImportDialog';
import { ContextMenu } from '@/components/ContextMenu';
import { type MediaItem } from '@/lib/db';
import { toast } from 'sonner';

interface IndexProps {
  activeTags: string[];
}

export default function Index({ activeTags }: IndexProps) {
  const store = useMediaStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; itemId: number } | null>(null);
  const [batchTagMode, setBatchTagMode] = useState<'add' | 'remove' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let items = store.allMedia;
    
    // Sidebar tag filter (intersection)
    if (activeTags.length > 0) {
      items = items.filter(m => activeTags.every(t => m.tags.includes(t)));
    }

    // Search
    if (search.trim()) {
      const q = parseSearch(search);
      if (q.tags.length > 0) {
        items = items.filter(m => q.tags.every(t => m.tags.includes(t)));
      }
      if (q.ratingOp) {
        const { op, value } = q.ratingOp;
        items = items.filter(m => {
          if (m.rating == null) return false;
          switch (op) {
            case '>': return m.rating > value;
            case '<': return m.rating < value;
            case '>=': return m.rating >= value;
            case '<=': return m.rating <= value;
            case '=': return m.rating === value;
          }
        });
      }
      if (q.yearOp) {
        items = items.filter(m => m.year === q.yearOp!.value);
      }
      if (q.text) {
        const lower = q.text.toLowerCase();
        items = items.filter(m => m.filename.toLowerCase().includes(lower));
      }
    }

    return items;
  }, [store.allMedia, activeTags, search]);

  const handleSelect = useCallback((id: number, e: React.MouseEvent) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (e.ctrlKey || e.metaKey) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else if (e.shiftKey && prev.size > 0) {
        const ids = filtered.map(m => m.id!);
        const lastSelected = [...prev].pop()!;
        const start = ids.indexOf(lastSelected);
        const end = ids.indexOf(id);
        const [from, to] = start < end ? [start, end] : [end, start];
        for (let i = from; i <= to; i++) next.add(ids[i]);
      } else {
        if (next.size === 1 && next.has(id)) {
          next.clear();
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  }, [filtered]);

  const handleContextMenu = useCallback((id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!selected.has(id)) {
      setSelected(new Set([id]));
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, itemId: id });
  }, [selected]);

  const selectedIds = [...selected];

  const addDemoData = async () => {
    const demos = [
      'Inception.2010.2160p.BluRay.mkv',
      'The.Matrix.1999.1080p.mkv',
      'Interstellar.2014.2160p.HDR.mkv',
      'Blade.Runner.2049.2017.1080p.mkv',
      'Dune.2021.2160p.IMAX.mkv',
      'Arrival.2016.1080p.mkv',
      'The.Dark.Knight.2008.2160p.mkv',
      'Parasite.2019.1080p.mkv',
      'Mad.Max.Fury.Road.2015.2160p.mkv',
      'Spirited.Away.2001.1080p.mkv',
    ];
    await store.bulkAddMedia(demos.map(f => ({
      filename: f,
      path: `/media/movies/${f}`,
      tags: [],
    })));
    toast.success(`已添加 ${demos.length} 条演示数据`);
  };

  // Virtual grid config
  const CARD_W = 180;
  const CARD_H = 320;
  const COMPACT_H = 40;
  const containerWidth = containerRef.current?.clientWidth ?? 1000;
  const colCount = Math.max(1, Math.floor(containerWidth / CARD_W));

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 flex items-center gap-3 border-b border-border px-4 shrink-0 bg-card/50 backdrop-blur">
        <SidebarTrigger />
        <h1 className="text-lg font-bold text-primary tracking-tight">TagFlow Media</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm bg-muted/30"
            placeholder="搜索... (支持 tag:科幻 rating>8 year:2020)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('compact')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
          <Upload className="h-4 w-4 mr-1" />导入
        </Button>
        <Button size="sm" variant="ghost" onClick={addDemoData}>
          <Plus className="h-4 w-4 mr-1" />演示数据
        </Button>
      </header>

      {/* Stats */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-card/30">
        共 {store.allMedia.length} 项 · 当前显示 {filtered.length} 项
        {activeTags.length > 0 && ` · 筛选: ${activeTags.join(' + ')}`}
      </div>

      {/* Main grid */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <p className="text-lg">暂无媒体项</p>
            <p className="text-sm">点击"导入"按钮导入 JSON 数据，或添加演示数据</p>
          </div>
        ) : viewMode === 'compact' ? (
          <div className="space-y-0.5">
            {filtered.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                tags={store.allTags}
                selected={selected.has(item.id!)}
                onSelect={e => handleSelect(item.id!, e)}
                onContextMenu={e => handleContextMenu(item.id!, e)}
                onDoubleClick={() => setDetailItem(item)}
                compact
              />
            ))}
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(170px, 1fr))` }}
          >
            {filtered.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                tags={store.allTags}
                selected={selected.has(item.id!)}
                onSelect={e => handleSelect(item.id!, e)}
                onContextMenu={e => handleContextMenu(item.id!, e)}
                onDoubleClick={() => setDetailItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch toolbar */}
      <BatchToolbar
        count={selected.size}
        onAddTag={tag => { store.addTagToItems(selectedIds, tag); setSelected(new Set()); }}
        onRemoveTag={tag => { store.removeTagFromItems(selectedIds, tag); setSelected(new Set()); }}
        onDelete={() => { store.deleteMedia(selectedIds); setSelected(new Set()); }}
        onClear={() => setSelected(new Set())}
      />

      {/* Detail dialog */}
      <MediaDetailDialog
        item={detailItem}
        tags={store.allTags}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        onUpdate={store.updateMediaItem}
        onAddTag={store.addTagToItems}
        onRemoveTag={store.removeTagFromItems}
      />

      {/* Import dialog */}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={store.bulkAddMedia}
      />

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          onAddTag={() => setBatchTagMode('add')}
          onRemoveTag={() => setBatchTagMode('remove')}
          onViewDetail={() => {
            const item = store.allMedia.find(m => m.id === ctxMenu.itemId);
            if (item) setDetailItem(item);
          }}
          onDelete={() => { store.deleteMedia(selectedIds); setSelected(new Set()); }}
        />
      )}
    </div>
  );
}
