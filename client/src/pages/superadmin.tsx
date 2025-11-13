import { StatCard } from "@/components/stat-card";
import { Building2, Users, UserCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface SuperadminStats {
  totalPropertyCompanies: number;
  totalAdminUsers: number;
  activeAdminUsers: number;
  totalCommunities: number;
}

export default function SuperadminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<SuperadminStats>({
    queryKey: ["/api/superadmin/stats"],
  });

  const statsData = stats ? [
    { 
      title: "Empresas de Gestión", 
      value: stats.totalPropertyCompanies, 
      icon: Building2 
    },
    { 
      title: "Total de Administradores", 
      value: stats.totalAdminUsers, 
      icon: Users 
    },
    { 
      title: "Administradores Activos", 
      value: stats.activeAdminUsers, 
      icon: UserCheck 
    },
    { 
      title: "Comunidades Gestionadas", 
      value: stats.totalCommunities, 
      icon: MapPin 
    },
  ] : [];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] min-h-full" data-testid="page-superadmin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            Panel de Superadministrador
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las empresas de administración y sus administradores
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-32 animate-pulse border-0 shadow-md">
                <CardContent className="p-6" />
              </Card>
            ))}
          </>
        ) : (
          statsData.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Gestión de Empresas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crear y gestionar empresas de administración de fincas que supervisan múltiples comunidades de vecinos.
            </p>
            <Link href="/superadmin/companies">
              <Button className="w-full" data-testid="button-manage-companies">
                Gestionar Empresas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Cuentas de Administrador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crear y gestionar cuentas de administradores de fincas, asignarlas a empresas de gestión y controlar el acceso.
            </p>
            <Link href="/superadmin/admins">
              <Button className="w-full" data-testid="button-manage-admins">
                Gestionar Administradores
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
