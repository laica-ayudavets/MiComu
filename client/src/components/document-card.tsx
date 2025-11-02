import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Sparkles } from "lucide-react";

interface DocumentCardProps {
  id: string;
  title: string;
  type: "acta" | "contrato" | "factura" | "otro";
  date: string;
  hasAIAnalysis?: boolean;
  agreementsCount?: number;
  onView?: () => void;
  onDownload?: () => void;
  onAnalyze?: () => void;
}

const typeLabels = {
  acta: "Acta",
  contrato: "Contrato",
  factura: "Factura",
  otro: "Documento",
};

export function DocumentCard({
  id,
  title,
  type,
  date,
  hasAIAnalysis,
  agreementsCount,
  onView,
  onDownload,
  onAnalyze,
}: DocumentCardProps) {
  return (
    <Card className="hover-elevate border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid={`card-document-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {typeLabels[type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
              </div>
            </div>
            {hasAIAnalysis && agreementsCount !== undefined && (
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                <Sparkles className="w-3 h-3" />
                <span>{agreementsCount} acuerdos detectados</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                data-testid={`button-view-${id}`}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                data-testid={`button-download-${id}`}
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
              {!hasAIAnalysis && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAnalyze}
                  data-testid={`button-analyze-${id}`}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Analizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
