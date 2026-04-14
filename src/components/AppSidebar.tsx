import { Film, Tags, Upload, ChevronDown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { type Tag, type TagCategoryDef } from '@/lib/db';
import { TagBadge } from './TagBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AppSidebarProps {
  tags: Tag[];
  categories: TagCategoryDef[];
  activeTags: string[];
  onToggleTag: (name: string) => void;
}

export function AppSidebar({ tags, categories, activeTags, onToggleTag }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const categoryOrder = categories.length > 0
    ? categories.map(c => c.key)
    : ['genre', 'quality', 'year', 'custom'];

  const grouped = categoryOrder.map(catKey => {
    const catDef = categories.find(c => c.key === catKey);
    return {
      category: catKey,
      label: catDef ? `${catDef.emoji} ${catDef.label}` : catKey,
      items: tags.filter(t => t.category === catKey),
    };
  });

  const handleToggleTag = (name: string) => {
    // If not on /, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
    }
    onToggleTag(name);
  };

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
                              onClick={() => handleToggleTag(tag.name)}
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
