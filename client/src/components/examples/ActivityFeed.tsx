import { ActivityFeed } from '../activity-feed';

export default function ActivityFeedExample() {
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
      title: 'Acta Enero 2025 analizada',
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
  ];

  return (
    <div className="p-8 max-w-md">
      <ActivityFeed activities={activities} />
    </div>
  );
}
