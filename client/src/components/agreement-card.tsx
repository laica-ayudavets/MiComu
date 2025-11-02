import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, CheckCircle2 } from "lucide-react";

interface AgreementCardProps {
  id: string;
  title: string;
  responsible: string | null;
  deadline: Date | null;
  status: "pendiente" | "aprobado" | "rechazado";
  description?: string;
}

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  aprobado: {
    label: "Aprobado",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  rechazado: {
    label: "Rechazado",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
};

export function AgreementCard({
  id,
  title,
  responsible,
  deadline,
  status,
  description,
}: AgreementCardProps) {
  const formattedDeadline = deadline 
    ? new Date(deadline).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    : 'Sin fecha';

  return (
    <Card className="hover-elevate" data-testid={`card-agreement-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-2">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {description}
              </p>
            )}
            <div className="space-y-1">
              {responsible && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  <span>{responsible}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formattedDeadline}</span>
              </div>
            </div>
          </div>
          <Badge className={statusConfig[status].color}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
