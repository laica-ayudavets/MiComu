import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Building2, MapPin, Search, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCommunities, useCurrentCommunity } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Comunidades() {
  const { data: communities = [], isLoading } = useCommunities();
  const { data: currentCommunity } = useCurrentCommunity();
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const { toast } = useToast();

  const selectCommunityMutation = useMutation({
    mutationFn: async (communityId: number) => {
      return apiRequest("/api/auth/select-community", {
        method: "POST",
        body: JSON.stringify({ communityId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-community"] });
      toast({
        title: "Comunidad seleccionada",
        description: "La comunidad ha sido seleccionada correctamente",
      });
    },
  });

  const filteredCommunities = communities.filter((community) => {
    const matchesName = community.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesAddress =
      community.address.toLowerCase().includes(searchAddress.toLowerCase()) ||
      community.city.toLowerCase().includes(searchAddress.toLowerCase()) ||
      community.postalCode.toLowerCase().includes(searchAddress.toLowerCase());
    return matchesName && matchesAddress;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Comunidades
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona todas las comunidades de tu administración de fincas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Comunidades</CardTitle>
          <CardDescription>
            Encuentra comunidades por nombre o dirección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="search-name" className="text-sm font-medium">
                Buscar por nombre
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-name"
                  data-testid="input-search-name"
                  placeholder="Ej: Las Flores"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="search-address" className="text-sm font-medium">
                Buscar por dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-address"
                  data-testid="input-search-address"
                  placeholder="Ej: Madrid, 28001"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCommunities.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No se encontraron comunidades con los criterios de búsqueda
            </p>
          </div>
        ) : (
          filteredCommunities.map((community) => {
            const isActive = currentCommunity?.id === community.id;
            return (
              <Card
                key={community.id}
                className={`hover-elevate transition-all ${
                  isActive ? "border-primary" : ""
                }`}
                data-testid={`card-community-${community.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {community.name}
                      </CardTitle>
                      {isActive && (
                        <Badge variant="default" className="mt-2" data-testid="badge-active">
                          Activa
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-foreground">{community.address}</p>
                        <p className="text-muted-foreground">
                          {community.city}, {community.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {community.totalUnits} unidades
                      </span>
                    </div>
                  </div>
                  {!isActive && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => selectCommunityMutation.mutate(community.id)}
                      disabled={selectCommunityMutation.isPending}
                      data-testid={`button-select-${community.id}`}
                    >
                      {selectCommunityMutation.isPending ? "Seleccionando..." : "Seleccionar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
