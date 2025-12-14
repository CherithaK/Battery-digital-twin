import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Battery,
  TrendingUp,
  Zap,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { useNavigation, type ActiveSection } from "@/App";

const mainNavItems: { title: string; section: ActiveSection; icon: typeof LayoutDashboard }[] = [
  {
    title: "Dashboard",
    section: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Electrochemical Analysis",
    section: "electrochemical-analysis",
    icon: Activity,
  },
  {
    title: "System Diagnostics",
    section: "system-diagnostics",
    icon: AlertTriangle,
  },
];

const insightItems: { title: string; section: ActiveSection; icon: typeof TrendingUp }[] = [
  {
    title: "Multi-Cycle Trends",
    section: "multi-cycle-trends",
    icon: TrendingUp,
  },
  {
    title: "Kinetic Analysis",
    section: "kinetic-analysis",
    icon: Zap,
  },
  {
    title: "Insights",
    section: "insights",
    icon: Lightbulb,
  },
];

export function AppSidebar() {
  const { activeSection, setActiveSection } = useNavigation();

  const handleNavClick = (section: ActiveSection) => {
    setActiveSection(section);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Battery className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Digital Twin
            </span>
            <span className="text-xs text-muted-foreground">Battery Health</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = activeSection === item.section;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavClick(item.section)}
                      className={
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                      data-testid={`nav-${item.section}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => {
                const isActive = activeSection === item.section;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavClick(item.section)}
                      className={
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                      data-testid={`nav-${item.section}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reference
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavClick("theory-models")}
                  className={
                    activeSection === "theory-models"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : ""
                  }
                  data-testid="nav-theory-models"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Theory & Models</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="px-3">
          <p className="text-xs text-muted-foreground">
            BMS-Inspired Intelligence Layer
          </p>
          <p className="text-xs text-muted-foreground opacity-70">
            v1.0.0 — Research Grade
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
