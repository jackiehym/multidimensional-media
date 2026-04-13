import { Film, Tags, Upload, ChevronDown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { type Tag, type TagCategory } from '@/lib/db';
import { TagBadge } from './TagBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AppSidebarProps {
  tags: Tag[];
  activeTags: string[];
  onToggleTag: (name: string) => void;
}

const categoryLabels: Record<TagCategory, string> = {
  year: '📅 年份',
  genre: '🎬 类型',
  quality: '📺 画质',
  custom: '🏷️ 自定义',
};

const categoryOrder: TagCategory[] = ['genre', 'quality', 'year', 'custom'];

export function AppSidebar({ tags, activeTags, onToggleTag }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const grouped = categoryOrder.map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    items: tags.filter(t => t.category === cat),
  }));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            导航
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                    <Film className="mr-2 h-4 w-4" />
                    {!collapsed && <span>媒体库</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/tags" end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                    <Tags className="mr-2 h-4 w-4" />
                    {!collapsed && <span>标签管理</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              标签过滤
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {activeTags.length > 0 && (
                <button
                  onClick={() => activeTags.forEach(t => onToggleTag(t))}
                  className="mb-2 text-xs text-primary hover:underline px-2"
                >
                  清除所有筛选
                </button>
              )}
              <div className="space-y-1">
                {grouped.map(group => (
                  group.items.length > 0 && (
                    <Collapsible key={group.category} defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ChevronDown className="h-3 w-3" />
                        {group.label}
                        <span className="ml-auto text-[10px]">{group.items.length}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="flex flex-wrap gap-1 px-2 py-1">
                          {group.items.map(tag => (
                            <TagBadge
                              key={tag.id}
                              name={tag.name}
                              category={tag.category}
                              active={activeTags.includes(tag.name)}
                              onClick={() => onToggleTag(tag.name)}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
