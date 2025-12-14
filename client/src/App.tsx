import { useState, createContext, useContext, useCallback } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";

export type ActiveSection = 
  | "dashboard"
  | "electrochemical-analysis"
  | "system-diagnostics"
  | "multi-cycle-trends"
  | "kinetic-analysis"
  | "insights"
  | "references";

interface NavigationContextType {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  scrollToSection: (section: ActiveSection) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  activeSection: "dashboard",
  setActiveSection: () => {},
  scrollToSection: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");

  const scrollToSection = useCallback((section: ActiveSection) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NavigationContext.Provider value={{ activeSection, setActiveSection, scrollToSection }}>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-4 px-4 h-14 border-b border-border bg-background shrink-0 z-50">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <span className="text-sm font-medium hidden sm:block">Battery Health Digital Twin</span>
                  </div>
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-hidden bg-background">
                  <Dashboard />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </NavigationContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
