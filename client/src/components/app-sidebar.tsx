import {
  Building2,
  FileText,
  CheckSquare,
  AlertCircle,
  Users,
  DollarSign,
  Euro,
  LayoutDashboard,
  Settings,
  CalendarDays,
  LogOut,
  UserCircle,
  UsersRound,
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
import { useCurrentCommunity, useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  {
    title: "Cuotas",
    url: "/cuotas",
    icon: Euro,
  },
  {
    title: "Juntas",
    url: "/juntas",
    icon: CalendarDays,
  },
];

const adminMenuItems = [
  {
    title: "Comunidades",
    url: "/comunidades",
    icon: Building2,
  },
  {
    title: "Vecinos",
    url: "/vecinos",
    icon: UsersRound,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { data: currentCommunity } = useCurrentCommunity();
  const { data: user } = useUser();
  const { toast } = useToast();
  
  const isAdminFincas = user?.role === "admin_fincas";

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Administra Mi Comunidad</h2>
            <p className="text-xs text-muted-foreground" data-testid="text-community-name">
              {currentCommunity?.name || "Cargando..."}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdminFincas && adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {menuItems.slice(1)
                .filter((item) => {
                  // Hide Proveedores from vecino role
                  if (item.url === "/proveedores" && user?.role === "vecino") {
                    return false;
                  }
                  return true;
                })
                .map((item) => (
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/perfil"}>
              <Link href="/perfil" data-testid="link-perfil">
                <UserCircle className="w-4 h-4" />
                <span>Mi Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/configuracion"}>
              <Link href="/configuracion" data-testid="link-configuracion">
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
