import { StatCard } from '../stat-card';
import { AlertCircle } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-8">
      <StatCard
        title="Incidencias Activas"
        value={12}
        icon={AlertCircle}
        trend={{ value: 15, isPositive: false }}
      />
    </div>
  );
}
