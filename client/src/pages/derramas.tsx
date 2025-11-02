import { useState } from "react";
import { DerramaCard } from "@/components/derrama-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function Derramas() {
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const derramas = [
    {
      id: "1",
      title: "Reparación fachada principal",
      amount: 15000,
      collected: 12000,
      membersTotal: 30,
      membersPaid: 24,
      dueDate: "15 Mar 2025",
    },
    {
      id: "2",
      title: "Cambio de ascensores",
      amount: 45000,
      collected: 38000,
      membersTotal: 30,
      membersPaid: 26,
      dueDate: "30 Jun 2025",
    },
    {
      id: "3",
      title: "Reparación tejado",
      amount: 8500,
      collected: 8500,
      membersTotal: 30,
      membersPaid: 30,
      dueDate: "15 Ene 2025",
    },
  ];

  const filteredDerramas = derramas.filter((derrama) =>
    searchTerm === "" ||
    derrama.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6" data-testid="page-derramas">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Derramas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de derramas y pagos extraordinarios
          </p>
        </div>
        <Button data-testid="button-new-derrama">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Derrama
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar derramas..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-derramas"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDerramas.map((derrama) => (
          <DerramaCard key={derrama.id} {...derrama} />
        ))}
      </div>

      {filteredDerramas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron derramas</p>
        </div>
      )}
    </div>
  );
}
