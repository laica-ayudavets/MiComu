import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const gradients = [
  "from-primary/10 to-primary/5",
  "from-accent/10 to-accent/5",
  "from-primary/10 via-accent/5 to-primary/5",
  "from-accent/10 via-primary/5 to-accent/5",
];

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  const gradientIndex = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`} data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-md">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
          {value}
        </div>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
