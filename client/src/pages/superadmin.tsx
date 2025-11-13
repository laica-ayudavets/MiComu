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
      title: "Property Companies", 
      value: stats.totalPropertyCompanies, 
      icon: Building2 
    },
    { 
      title: "Total Admin Users", 
      value: stats.totalAdminUsers, 
      icon: Users 
    },
    { 
      title: "Active Admins", 
      value: stats.activeAdminUsers, 
      icon: UserCheck 
    },
    { 
      title: "Communities Managed", 
      value: stats.totalCommunities, 
      icon: MapPin 
    },
  ] : [];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] min-h-full" data-testid="page-superadmin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            Superadmin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage property management companies and administrators
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
            <CardTitle className="text-lg">Property Companies Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create and manage property management companies that oversee multiple residential communities.
            </p>
            <Link href="/superadmin/companies">
              <Button className="w-full" data-testid="button-manage-companies">
                Manage Companies
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Administrator Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create and manage admin_fincas user accounts, assign them to property companies, and control access.
            </p>
            <Link href="/superadmin/admins">
              <Button className="w-full" data-testid="button-manage-admins">
                Manage Admins
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
