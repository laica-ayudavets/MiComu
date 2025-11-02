import { useState } from "react";
import { DocumentCard } from "@/components/document-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Search } from "lucide-react";

export default function Documentos() {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const documents = [
    {
      id: "1",
      title: "Acta Ordinaria Enero 2025",
      type: "acta" as const,
      date: "15 Ene 2025",
      hasAIAnalysis: true,
      agreementsCount: 3,
    },
    {
      id: "2",
      title: "Contrato mantenimiento ascensores",
      type: "contrato" as const,
      date: "10 Ene 2025",
      hasAIAnalysis: false,
    },
    {
      id: "3",
      title: "Factura reparación fachada",
      type: "factura" as const,
      date: "5 Ene 2025",
      hasAIAnalysis: false,
    },
    {
      id: "4",
      title: "Acta Extraordinaria Diciembre 2024",
      type: "acta" as const,
      date: "20 Dic 2024",
      hasAIAnalysis: true,
      agreementsCount: 5,
    },
    {
      id: "5",
      title: "Presupuesto limpieza 2025",
      type: "otro" as const,
      date: "15 Dic 2024",
      hasAIAnalysis: false,
    },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = filter === "todos" || doc.type === filter;
    const matchesSearch =
      searchTerm === "" ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6" data-testid="page-documentos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y analiza documentos con IA
          </p>
        </div>
        <Button data-testid="button-upload-document">
          <Upload className="w-4 h-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-documents"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="acta">Actas</SelectItem>
            <SelectItem value="contrato">Contratos</SelectItem>
            <SelectItem value="factura">Facturas</SelectItem>
            <SelectItem value="otro">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            {...document}
            onView={() => console.log('View document:', document.id)}
            onDownload={() => console.log('Download document:', document.id)}
            onAnalyze={() => console.log('Analyze document:', document.id)}
          />
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron documentos</p>
        </div>
      )}
    </div>
  );
}
