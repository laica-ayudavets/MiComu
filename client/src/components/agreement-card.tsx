import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, CheckCircle2 } from "lucide-react";

interface AgreementCardProps {
  id: string;
  title: string;
  responsible: string;
  deadline: string;
  status: "pendiente" | "completado" | "retrasado";
  onToggleStatus?: () => void;
}

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  completado: {
    label: "Completado",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  retrasado: {
    label: "Retrasado",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
};

export function AgreementCard({
  id,
  title,
  responsible,
  deadline,
  status,
  onToggleStatus,
}: AgreementCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-agreement-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-2">{title}</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3" />
                <span>{responsible}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{deadline}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={statusConfig[status].color}>
              {statusConfig[status].label}
            </Badge>
            {status !== "completado" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleStatus}
                data-testid={`button-toggle-${id}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Marcar completo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
