import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Building2, MapPin, Search, Users, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCommunities, useCurrentCommunity, useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Community } from "@shared/schema";

const communityFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  totalUnits: z.coerce.number().min(1, "Debe tener al menos 1 unidad"),
});

type CommunityFormValues = z.infer<typeof communityFormSchema>;

export default function Comunidades() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: communities = [], isLoading: communitiesLoading } = useCommunities();
  const { data: currentCommunity } = useCurrentCommunity();
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  if (!userLoading && user?.role !== "admin_fincas") {
    return <Redirect to="/" />;
  }

  const createForm = useForm<CommunityFormValues>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      province: "",
      totalUnits: 1,
    },
  });

  const editForm = useForm<CommunityFormValues>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      province: "",
      totalUnits: 1,
    },
  });

  const selectCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest("POST", "/api/auth/select-community", { communityId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-community"] });
      // Invalidate all community-scoped data queries when switching communities
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/derramas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Comunidad seleccionada",
        description: "La comunidad ha sido seleccionada correctamente",
      });
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CommunityFormValues) => {
      const res = await apiRequest("POST", "/api/communities", data);
      return res.json() as Promise<Community>;
    },
    onSuccess: (newCommunity: Community) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/communities"] });
      // Automatically select the newly created community
      selectCommunityMutation.mutate(newCommunity.id);
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Comunidad creada",
        description: "La comunidad ha sido creada correctamente y seleccionada",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear comunidad",
        description: error.message || "Ha ocurrido un error",
      });
    },
  });

  const updateCommunityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CommunityFormValues }) => {
      const res = await apiRequest("PATCH", `/api/communities/${id}`, data);
      return res.json() as Promise<Community>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-community"] });
      setIsEditDialogOpen(false);
      setSelectedCommunity(null);
      toast({
        title: "Comunidad actualizada",
        description: "Los datos de la comunidad han sido actualizados",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar comunidad",
        description: error.message || "Ha ocurrido un error",
      });
    },
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/communities/${id}`);
      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-community"] });
      setIsDeleteDialogOpen(false);
      setSelectedCommunity(null);
      toast({
        title: "Comunidad eliminada",
        description: "La comunidad ha sido eliminada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar comunidad",
        description: error.message || "Ha ocurrido un error",
      });
    },
  });

  const handleEditClick = (community: Community) => {
    setSelectedCommunity(community);
    editForm.reset({
      name: community.name,
      address: community.address,
      city: community.city,
      postalCode: community.postalCode || "",
      province: community.province || "",
      totalUnits: community.totalUnits,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (community: Community) => {
    setSelectedCommunity(community);
    setIsDeleteDialogOpen(true);
  };

  const filteredCommunities = communities.filter((community) => {
    const matchesName = community.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesAddress =
      community.address.toLowerCase().includes(searchAddress.toLowerCase()) ||
      community.city.toLowerCase().includes(searchAddress.toLowerCase()) ||
      (community.postalCode?.toLowerCase() || "").includes(searchAddress.toLowerCase());
    return matchesName && matchesAddress;
  });

  if (userLoading || communitiesLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Comunidades
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona todas las comunidades de tu administración de fincas
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-community"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Comunidad
        </Button>
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
              {communities.length === 0
                ? "No tienes comunidades. Crea tu primera comunidad para empezar."
                : "No se encontraron comunidades con los criterios de búsqueda"}
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(community)}
                        data-testid={`button-edit-${community.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(community)}
                        data-testid={`button-delete-${community.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                          {community.city}{community.postalCode ? `, ${community.postalCode}` : ""}
                          {community.province ? ` (${community.province})` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {(community as any).residentCount ?? 0} residentes · {community.totalUnits} unidades
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Comunidad</DialogTitle>
            <DialogDescription>
              Añade una nueva comunidad a tu administración de fincas
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createCommunityMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la comunidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Comunidad Las Flores" data-testid="input-community-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Calle Mayor, 10" data-testid="input-community-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Madrid" data-testid="input-community-city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código postal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 28001" data-testid="input-community-postal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Madrid" data-testid="input-community-province" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="totalUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de viviendas/unidades</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Ej: 24" data-testid="input-community-units" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCommunityMutation.isPending} data-testid="button-submit-create">
                  {createCommunityMutation.isPending ? "Creando..." : "Crear Comunidad"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Comunidad</DialogTitle>
            <DialogDescription>
              Modifica los datos de la comunidad
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => {
              if (selectedCommunity) {
                updateCommunityMutation.mutate({ id: selectedCommunity.id, data });
              }
            })} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la comunidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Comunidad Las Flores" data-testid="input-edit-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Calle Mayor, 10" data-testid="input-edit-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Madrid" data-testid="input-edit-city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código postal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 28001" data-testid="input-edit-postal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Madrid" data-testid="input-edit-province" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="totalUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de viviendas/unidades</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Ej: 24" data-testid="input-edit-units" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCommunityMutation.isPending} data-testid="button-submit-edit">
                  {updateCommunityMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comunidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la comunidad "{selectedCommunity?.name}" y todos sus datos asociados (incidencias, documentos, acuerdos, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCommunity) {
                  deleteCommunityMutation.mutate(selectedCommunity.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteCommunityMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
