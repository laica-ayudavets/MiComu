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
    <Card className="hover-elevate border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden" data-testid={`card-derrama-${id}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-base">{title}</h3>
          <Badge 
            variant={isPastDue ? "destructive" : "secondary"}
            className={!isPastDue ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20" : ""}
          >
            {dueDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        <div className="flex items-baseline gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl font-bold tabular-nums bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            {collected.toLocaleString('es-ES')}€
          </span>
          <span className="text-sm text-muted-foreground">
            / {amount.toLocaleString('es-ES')}€
          </span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2.5" />
          <div 
            className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full opacity-20 blur-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
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
