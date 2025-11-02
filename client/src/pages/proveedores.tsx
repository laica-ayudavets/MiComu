import { useState } from "react";
import { ProviderCard } from "@/components/provider-card";
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

export default function Proveedores() {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const providers = [
    {
      id: "1",
      name: "Fontaneros 24h",
      category: "Fontanería",
      email: "servicios@fontaneros24h.es",
      phone: "+34 600 123 456",
      rating: 4.5,
      servicesCount: 12,
    },
    {
      id: "2",
      name: "Limpiezas Luna",
      category: "Limpieza",
      email: "info@limpiezasluna.com",
      phone: "+34 610 234 567",
      rating: 4.8,
      servicesCount: 24,
    },
    {
      id: "3",
      name: "Jardines Verdes",
      category: "Jardinería",
      email: "contacto@jardinesverdes.com",
      phone: "+34 620 345 678",
      rating: 4.3,
      servicesCount: 8,
    },
    {
      id: "4",
      name: "Electricidad López",
      category: "Electricidad",
      email: "lopez@electric.es",
      phone: "+34 630 456 789",
      rating: 4.7,
      servicesCount: 15,
    },
    {
      id: "5",
      name: "SeguridadTotal S.L.",
      category: "Seguridad",
      email: "info@seguridadtotal.com",
      phone: "+34 640 567 890",
      rating: 4.6,
      servicesCount: 5,
    },
  ];

  const filteredProviders = providers.filter((provider) => {
    const matchesFilter = filter === "todos" || provider.category === filter;
    const matchesSearch =
      searchTerm === "" ||
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = Array.from(new Set(providers.map((p) => p.category)));

  return (
    <div className="p-6 space-y-6" data-testid="page-proveedores">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Proveedores</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de proveedores y servicios
          </p>
        </div>
        <Button data-testid="button-new-provider">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-providers"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            {...provider}
            onContact={() => console.log('Contact provider:', provider.id)}
          />
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron proveedores</p>
        </div>
      )}
    </div>
  );
}
