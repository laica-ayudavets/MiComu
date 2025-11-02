import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Mail, Phone } from "lucide-react";

interface ProviderCardProps {
  id: string;
  name: string;
  category: string;
  email: string;
  phone?: string;
  rating?: number;
  servicesCount?: number;
  onContact?: () => void;
}

export function ProviderCard({
  id,
  name,
  category,
  email,
  phone,
  rating,
  servicesCount,
  onContact,
}: ProviderCardProps) {
  return (
    <Card className="hover-elevate border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid={`card-provider-${id}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base truncate">{name}</h3>
              <Badge variant="secondary" className="mt-1 bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/20">
                {category}
              </Badge>
            </div>
            {rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate">{email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{phone}</span>
              </div>
            )}
          </div>
          {servicesCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {servicesCount} servicios realizados
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onContact}
            data-testid={`button-contact-${id}`}
          >
            Contactar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
