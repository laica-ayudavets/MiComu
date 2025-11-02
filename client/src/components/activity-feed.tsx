import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Activity {
  id: string;
  type: "incidencia" | "documento" | "acuerdo" | "derrama";
  title: string;
  user: string;
  time: string;
  status?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeConfig = {
  incidencia: { label: "Incidencia", color: "bg-warning/10 text-warning" },
  documento: { label: "Documento", color: "bg-info/10 text-info" },
  acuerdo: { label: "Acuerdo", color: "bg-success/10 text-success" },
  derrama: { label: "Derrama", color: "bg-primary/10 text-primary" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card data-testid="card-activity-feed">
      <CardHeader>
        <CardTitle className="text-lg">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {activity.user
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge variant="secondary" className={typeConfig[activity.type].color}>
                  {typeConfig[activity.type].label}
                </Badge>
                {activity.status && (
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm mt-1">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.user} • {activity.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
