import { useState } from "react";
import { IncidentCard } from "@/components/incident-card";
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

export default function Incidencias() {
  const [filter, setFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const incidents = [
    {
      id: "1",
      title: "Fuga de agua en el portal principal",
      status: "en_curso" as const,
      priority: "alta" as const,
      category: "Fontanería",
      reporter: "María García",
      date: "hace 2 horas",
    },
    {
      id: "2",
      title: "Luz fundida en escalera 3ª planta",
      status: "pendiente" as const,
      priority: "media" as const,
      category: "Electricidad",
      reporter: "Juan Pérez",
      date: "hace 5 horas",
    },
    {
      id: "3",
      title: "Ruidos en ascensor B",
      status: "pendiente" as const,
      priority: "baja" as const,
      category: "Mantenimiento",
      reporter: "Ana López",
      date: "hace 1 día",
    },
    {
      id: "4",
      title: "Puerta del garaje no cierra bien",
      status: "resuelto" as const,
      priority: "media" as const,
      category: "Cerrajería",
      reporter: "Pedro Martín",
      date: "hace 3 días",
    },
    {
      id: "5",
      title: "Goteo en la zona de contenedores",
      status: "en_curso" as const,
      priority: "alta" as const,
      category: "Fontanería",
      reporter: "Laura Sánchez",
      date: "hace 1 día",
    },
  ];

  const filteredIncidents = incidents.filter((incident) => {
    const matchesFilter = filter === "todas" || incident.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6" data-testid="page-incidencias">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Incidencias</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las incidencias de la comunidad
          </p>
        </div>
        <Button data-testid="button-new-incident">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Incidencia
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar incidencias..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-incidents"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_curso">En Curso</SelectItem>
            <SelectItem value="resuelto">Resueltas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIncidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            {...incident}
            onClick={() => console.log('Incident clicked:', incident.id)}
          />
        ))}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron incidencias</p>
        </div>
      )}
    </div>
  );
}
