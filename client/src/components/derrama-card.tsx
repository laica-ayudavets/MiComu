import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users } from "lucide-react";

interface DerramaCardProps {
  id: string;
  title: string;
  amount: number;
  collected: number;
  membersTotal: number;
  membersPaid: number;
  dueDate: string;
}

export function DerramaCard({
  id,
  title,
  amount,
  collected,
  membersTotal,
  membersPaid,
  dueDate,
}: DerramaCardProps) {
  const progress = (collected / amount) * 100;
  const isPastDue = new Date(dueDate) < new Date();

  return (
    <Card className="hover-elevate" data-testid={`card-derrama-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-base">{title}</h3>
          <Badge variant={isPastDue ? "destructive" : "secondary"}>
            {dueDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <span className="text-2xl font-bold tabular-nums">
            {collected.toLocaleString('es-ES')}€
          </span>
          <span className="text-sm text-muted-foreground">
            / {amount.toLocaleString('es-ES')}€
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>
              {membersPaid} de {membersTotal} vecinos
            </span>
          </div>
          <span>{Math.round(progress)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
