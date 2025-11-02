import {
  Building2,
  FileText,
  CheckSquare,
  AlertCircle,
  Users,
  DollarSign,
  LayoutDashboard,
  Settings,
} from "lucide-react";
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
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Incidencias",
    url: "/incidencias",
    icon: AlertCircle,
  },
  {
    title: "Documentos",
    url: "/documentos",
    icon: FileText,
  },
  {
    title: "Acuerdos",
    url: "/acuerdos",
    icon: CheckSquare,
  },
  {
    title: "Derramas",
    url: "/derramas",
    icon: DollarSign,
  },
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Users,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Administra Mi Comunidad</h2>
            <p className="text-xs text-muted-foreground">Los Pinos</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <Link href="/configuracion">
          <SidebarMenuButton data-testid="link-configuracion">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
