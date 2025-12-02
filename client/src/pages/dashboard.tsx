import { StatCard } from "@/components/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import { IncidentCard } from "@/components/incident-card";
import { AlertCircle, FileText, CheckSquare, DollarSign, Receipt, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Incident } from "@shared/schema";

interface RecentActivity {
  id: string;
  type: 'incidencia';
  title: string;
  status: string;
  reporterName: string;
  createdAt: string;
}

interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  totalDocuments: number;
  activeDerramas: number;
  totalDerramas: number;
  unpaidQuotas: number;
}

export default function Dashboard() {
  const { data: user } = useUser();
  const isAdmin = user?.role === 'admin_fincas' || user?.role === 'presidente';

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  // Fetch recent activity only for admin users
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/activity"],
    enabled: isAdmin,
  });

  const recentIncidents = incidents?.slice(0, 3) || [];

  const statsData = stats ? [
    { title: "Total Incidencias", value: stats.totalIncidents, icon: AlertCircle },
    { title: "Incidencias Activas", value: stats.activeIncidents, icon: AlertCircle },
    { title: "Documentos", value: stats.totalDocuments, icon: FileText },
    { title: "Derramas Activas", value: stats.activeDerramas, icon: DollarSign },
    { title: "Total Derramas", value: stats.totalDerramas, icon: Receipt },
    { title: "Cuotas Impagadas", value: stats.unpaidQuotas, icon: AlertTriangle },
  ] : [];

  // Format recent activity for ActivityFeed component
  const activities = recentActivity?.map(activity => ({
    id: activity.id,
    type: activity.type,
    title: activity.title,
    user: activity.reporterName,
    time: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es }),
    status: activity.status === 'pendiente' ? 'Pendiente' : 
            activity.status === 'en_curso' ? 'En curso' : 'Resuelto',
  })) || [];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] min-h-full" data-testid="page-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Resumen de la actividad de tu comunidad
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
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

      <div className={`grid gap-6 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        <div className={isAdmin ? 'lg:col-span-2' : ''}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Incidencias Recientes</CardTitle>
              <Button variant="ghost" size="sm" data-testid="button-view-all-incidents">
                Ver todas
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {incidentsLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-md" />
                  ))}
                </>
              ) : recentIncidents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay incidencias recientes</p>
              ) : (
                recentIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    id={incident.id}
                    title={incident.title}
                    status={incident.status}
                    priority={incident.priority}
                    category={incident.category}
                    reporter="Usuario"
                    date={new Date(incident.createdAt).toLocaleDateString('es-ES')}
                    onClick={() => console.log('Incident clicked:', incident.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div>
            {activityLoading ? (
              <Card data-testid="card-activity-feed">
                <CardHeader>
                  <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-md" />
                  ))}
                </CardContent>
              </Card>
            ) : activities.length === 0 ? (
              <Card data-testid="card-activity-feed">
                <CardHeader>
                  <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">No hay actividad reciente</p>
                </CardContent>
              </Card>
            ) : (
              <ActivityFeed activities={activities} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
