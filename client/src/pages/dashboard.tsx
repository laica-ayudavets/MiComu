import { StatCard } from "@/components/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import { IncidentCard } from "@/components/incident-card";
import { AlertCircle, FileText, CheckSquare, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Incident } from "@shared/schema";

interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  totalDocuments: number;
  activeDerramas: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const recentIncidents = incidents?.slice(0, 3) || [];

  const statsData = stats ? [
    { title: "Total Incidencias", value: stats.totalIncidents, icon: AlertCircle },
    { title: "Incidencias Activas", value: stats.activeIncidents, icon: AlertCircle },
    { title: "Documentos", value: stats.totalDocuments, icon: FileText },
    { title: "Derramas Activas", value: stats.activeDerramas, icon: DollarSign },
  ] : [];

  const activities = [
    {
      id: '1',
      type: 'incidencia' as const,
      title: 'Nueva incidencia: Fuga de agua en portal',
      user: 'María García',
      time: 'hace 30 min',
      status: 'Pendiente',
    },
    {
      id: '2',
      type: 'documento' as const,
      title: 'Acta Enero 2025 analizada con IA',
      user: 'Sistema IA',
      time: 'hace 2 horas',
    },
    {
      id: '3',
      type: 'acuerdo' as const,
      title: 'Acuerdo completado: Revisión ascensores',
      user: 'Juan Pérez',
      time: 'hace 1 día',
    },
    {
      id: '4',
      type: 'derrama' as const,
      title: 'Pago recibido: Reparación fachada',
      user: 'Carlos Ruiz',
      time: 'hace 2 días',
    },
  ];

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
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

        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
