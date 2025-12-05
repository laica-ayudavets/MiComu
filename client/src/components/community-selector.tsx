import { useState } from "react";
import { useUser, useCommunities, useCurrentCommunity } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunitySelector() {
  const [open, setOpen] = useState(false);
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

  const handleSelectCommunity = (communityId: string) => {
    if (communityId !== currentCommunity?.id) {
      selectCommunityMutation.mutate(communityId);
    }
    setOpen(false);
  };

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-[220px] justify-between border-0 hover-elevate px-2"
            disabled={selectCommunityMutation.isPending}
            data-testid="select-community"
          >
            <span className="truncate">
              {currentCommunity?.name || "Seleccionar comunidad"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar por nombre o dirección..." 
              data-testid="input-search-community"
            />
            <CommandList>
              <CommandEmpty>No se encontró ninguna comunidad.</CommandEmpty>
              <CommandGroup>
                {communities.map((community) => (
                  <CommandItem
                    key={community.id}
                    value={`${community.name} ${community.address || ""} ${community.city || ""}`}
                    onSelect={() => handleSelectCommunity(community.id)}
                    data-testid={`option-community-${community.id}`}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentCommunity?.id === community.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{community.name}</span>
                      {community.address && (
                        <span className="text-xs text-muted-foreground">
                          {community.address}{community.city ? `, ${community.city}` : ""}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
