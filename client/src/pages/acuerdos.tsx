import { useState } from "react";
import { AgreementCard } from "@/components/agreement-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function Acuerdos() {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const agreements = [
    {
      id: "1",
      title: "Instalar cámaras de seguridad en el portal",
      responsible: "SeguridadTotal S.L.",
      deadline: "1 Sep 2025",
      status: "pendiente" as const,
    },
    {
      id: "2",
      title: "Pintar fachada del edificio A",
      responsible: "Pinturas García",
      deadline: "15 Jun 2025",
      status: "pendiente" as const,
    },
    {
      id: "3",
      title: "Renovar contrato de limpieza",
      responsible: "Limpiezas Luna",
      deadline: "1 Mar 2025",
      status: "retrasado" as const,
    },
    {
      id: "4",
      title: "Revisar instalación eléctrica",
      responsible: "Electricidad López",
      deadline: "20 Ene 2025",
      status: "completado" as const,
    },
    {
      id: "5",
      title: "Mantenimiento de jardines",
      responsible: "Jardines Verdes",
      deadline: "10 Abr 2025",
      status: "pendiente" as const,
    },
  ];

  const filteredAgreements = agreements.filter((agreement) => {
    const matchesFilter = filter === "todos" || agreement.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      agreement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6" data-testid="page-acuerdos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Acuerdos</h1>
          <p className="text-muted-foreground mt-1">
            Seguimiento de acuerdos y compromisos
          </p>
        </div>
        <Button data-testid="button-new-agreement">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Acuerdo
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar acuerdos..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-agreements"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="completado">Completados</SelectItem>
            <SelectItem value="retrasado">Retrasados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgreements.map((agreement) => (
          <AgreementCard
            key={agreement.id}
            {...agreement}
            onToggleStatus={() => console.log('Toggle status:', agreement.id)}
          />
        ))}
      </div>

      {filteredAgreements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron acuerdos</p>
        </div>
      )}
    </div>
  );
}
