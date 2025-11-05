import { useUser, useCommunities, useCurrentCommunity } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function CommunitySelector() {
  const { toast } = useToast();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: communities, isLoading: communitiesLoading } = useCommunities();
  const { data: currentCommunity } = useCurrentCommunity();

  const selectCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest("POST", "/api/auth/select-community", { communityId });
    },
    onSuccess: () => {
      // Invalidate specific queries that depend on the selected community
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-community"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/derramas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      
      toast({
        title: "Comunidad seleccionada",
        description: "Los datos se han actualizado para la nueva comunidad",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar de comunidad",
        variant: "destructive",
      });
    },
  });

  if (userLoading || communitiesLoading) {
    return null;
  }

  // Only show selector for admin_fincas with multiple communities
  if (user?.role !== "admin_fincas" || !communities || communities.length <= 1) {
    // For single community or non-admin users, just show the community name
    if (currentCommunity) {
      return (
        <div className="flex items-center gap-2 px-3 py-2" data-testid="community-display">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{currentCommunity.name}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentCommunity?.id || ""}
        onValueChange={(value) => selectCommunityMutation.mutate(value)}
        disabled={selectCommunityMutation.isPending}
      >
        <SelectTrigger 
          className="h-8 w-[200px] border-0 focus:ring-0 hover-elevate" 
          data-testid="select-community"
        >
          <SelectValue placeholder="Seleccionar comunidad" />
        </SelectTrigger>
        <SelectContent>
          {communities.map((community) => (
            <SelectItem 
              key={community.id} 
              value={community.id}
              data-testid={`option-community-${community.id}`}
            >
              {community.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
