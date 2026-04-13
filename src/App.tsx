import { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useMediaStore } from "@/hooks/useMediaStore";
import Index from "./pages/Index";
import TagsPage from "./pages/TagsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const store = useMediaStore();

  const toggleTag = (name: string) => {
    setActiveTags(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar tags={store.allTags} activeTags={activeTags} onToggleTag={toggleTag} />
        <div className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<Index activeTags={activeTags} />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
