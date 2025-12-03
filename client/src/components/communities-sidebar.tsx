import { useState } from "react";
import { Building2, Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommunities, useCurrentCommunity, useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Community } from "@shared/schema";

export function CommunitiesSidebar() {
  const { data: user } = useUser();
  const { data: communities, isLoading } = useCommunities();
  const { data: currentCommunity } = useCurrentCommunity();
  const { toast } = useToast();
  const [nameSearch, setNameSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");

  // Only show for admin_fincas
  if (user?.role !== "admin_fincas") {
    return null;
  }

  const handleSelectCommunity = async (communityId: string) => {
    try {
      await apiRequest("POST", "/api/auth/select-community", { communityId });

      // Invalidate only the queries that need to be refetched
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-community"] });
      
      // Invalidate all business data queries
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/derramas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });

      toast({
        title: "Comunidad seleccionada",
        description: communities?.find((c) => c.id === communityId)?.name,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cambiar de comunidad",
      });
    }
  };

  const filteredCommunities = communities?.filter((community) => {
    const matchesName = community.name.toLowerCase().includes(nameSearch.toLowerCase());
    const matchesAddress =
      addressSearch === "" ||
      community.address.toLowerCase().includes(addressSearch.toLowerCase()) ||
      community.city.toLowerCase().includes(addressSearch.toLowerCase()) ||
      (community.postalCode && community.postalCode.includes(addressSearch));
    return matchesName && matchesAddress;
  });

  return (
    <div className="w-80 border-r bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold">Comunidades</h2>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-name"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por dirección..."
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-address"
            />
          </div>
        </div>

        {filteredCommunities && filteredCommunities.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {filteredCommunities.length} de {communities?.length || 0} comunidades
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : filteredCommunities && filteredCommunities.length > 0 ? (
            filteredCommunities.map((community) => (
              <CommunityItem
                key={community.id}
                community={community}
                isSelected={currentCommunity?.id === community.id}
                onClick={() => handleSelectCommunity(community.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No se encontraron comunidades</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface CommunityItemProps {
  community: Community;
  isSelected: boolean;
  onClick: () => void;
}

function CommunityItem({ community, isSelected, onClick }: CommunityItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md transition-all hover-elevate active-elevate-2 ${
        isSelected
          ? "bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/20"
          : "border border-transparent"
      }`}
      data-testid={`button-community-${community.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={`font-medium text-sm line-clamp-1 ${isSelected ? "text-primary" : ""}`}>
          {community.name}
        </h3>
        {isSelected && (
          <Badge variant="secondary" className="text-xs px-2 py-0 flex-shrink-0">
            Activa
          </Badge>
        )}
      </div>
      <div className="flex items-start gap-1 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <p className="line-clamp-2">{community.address}</p>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>{community.city}</span>
        <span>•</span>
        <span>{(community as any).residentCount ?? 0} residentes</span>
      </div>
    </button>
  );
}
