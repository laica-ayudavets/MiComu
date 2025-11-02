import { StatCard } from "@/components/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import { IncidentCard } from "@/components/incident-card";
import { AlertCircle, FileText, CheckSquare, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  //todo: remove mock functionality
  const stats = [
    { title: "Incidencias Activas", value: 12, icon: AlertCircle, trend: { value: 15, isPositive: false } },
    { title: "Documentos", value: 48, icon: FileText, trend: { value: 8, isPositive: true } },
    { title: "Acuerdos Pendientes", value: 7, icon: CheckSquare, trend: { value: 12, isPositive: false } },
    { title: "Derramas Activas", value: 2, icon: DollarSign },
  ];

  const recentIncidents = [
    {
      id: "1",
      title: "Fuga de agua en el portal principal",
      status: "en_curso" as const,
      priority: "alta" as const,
      category: "Fontanería",
      reporter: "María García",
      date: "hace 2 horas",
    },
    {
      id: "2",
      title: "Luz fundida en escalera 3ª planta",
      status: "pendiente" as const,
      priority: "media" as const,
      category: "Electricidad",
      reporter: "Juan Pérez",
      date: "hace 5 horas",
    },
    {
      id: "3",
      title: "Ruidos en ascensor B",
      status: "pendiente" as const,
      priority: "baja" as const,
      category: "Mantenimiento",
      reporter: "Ana López",
      date: "hace 1 día",
    },
  ];

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
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de la actividad de tu comunidad
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
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
              {recentIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  {...incident}
                  onClick={() => console.log('Incident clicked:', incident.id)}
                />
              ))}
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
