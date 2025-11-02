import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User } from "lucide-react";

interface IncidentCardProps {
  id: string;
  title: string;
  status: "pendiente" | "en_curso" | "resuelto";
  priority: "alta" | "media" | "baja";
  category: string;
  reporter: string;
  date: string;
  onClick?: () => void;
}

const statusColors = {
  pendiente: "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border border-warning/20",
  en_curso: "bg-gradient-to-r from-info/20 to-info/10 text-info border border-info/20",
  resuelto: "bg-gradient-to-r from-success/20 to-success/10 text-success border border-success/20",
};

const statusLabels = {
  pendiente: "Pendiente",
  en_curso: "En Curso",
  resuelto: "Resuelto",
};

const priorityColors = {
  alta: "border-l-4 border-l-destructive shadow-[inset_4px_0_8px_-2px_rgba(239,68,68,0.1)]",
  media: "border-l-4 border-l-warning shadow-[inset_4px_0_8px_-2px_rgba(245,158,11,0.1)]",
  baja: "border-l-4 border-l-muted shadow-[inset_4px_0_8px_-2px_rgba(0,0,0,0.05)]",
};

export function IncidentCard({
  id,
  title,
  status,
  priority,
  category,
  reporter,
  date,
  onClick,
}: IncidentCardProps) {
  return (
    <Card
      className={`hover-elevate cursor-pointer ${priorityColors[priority]}`}
      onClick={onClick}
      data-testid={`card-incident-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{category}</p>
          </div>
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{reporter}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
