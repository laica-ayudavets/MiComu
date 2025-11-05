import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IncidentCard } from "@/components/incident-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, CheckCircle, CalendarIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Incident, InsertIncident } from "@shared/schema";
import { insertIncidentSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCommunities, useUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const formSchema = insertIncidentSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  category: z.string().min(1, "La categoría es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Incidencias() {
  const [filter, setFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [communityFilter, setCommunityFilter] = useState("todas");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: user } = useUser();
  const { data: communities = [] } = useCommunities();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      priority: "media",
      status: "pendiente",
      tenantId: "default-tenant",
      reportedBy: null,
      assignedTo: null,
      resolvedAt: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/incidents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Incidencia creada",
        description: "La incidencia se ha creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/incidents/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la incidencia se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/incidents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Incidencia eliminada",
        description: "La incidencia se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredIncidents = useMemo(() => {
    const endOfSelectedDay = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999) : undefined;
    
    return incidents.filter((incident) => {
      const matchesFilter = filter === "todas" || incident.status === filter;
      const matchesSearch =
        searchTerm === "" ||
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "todas" || incident.category === categoryFilter;
      const matchesCommunity = communityFilter === "todas" || incident.communityId === communityFilter;
      
      const incidentDate = new Date(incident.createdAt);
      const matchesDateFrom = !dateFrom || incidentDate >= dateFrom;
      const matchesDateTo = !endOfSelectedDay || incidentDate <= endOfSelectedDay;
      
      return matchesFilter && matchesSearch && matchesCategory && matchesCommunity && matchesDateFrom && matchesDateTo;
    });
  }, [incidents, filter, searchTerm, categoryFilter, communityFilter, dateFrom, dateTo]);

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta incidencia?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-incidencias">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Incidencias</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las incidencias de la comunidad
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-incident">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Incidencia</DialogTitle>
              <DialogDescription>
                Crea una nueva incidencia para la comunidad
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Fuga de agua en el portal"
                          {...field}
                          data-testid="input-incident-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe la incidencia en detalle..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          data-testid="input-incident-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Fontanería"
                            {...field}
                            data-testid="input-incident-category"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Portal principal"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-incident-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-incident-priority">
                              <SelectValue placeholder="Selecciona prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="baja">Baja</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-incident-status">
                              <SelectValue placeholder="Selecciona estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="en_curso">En Curso</SelectItem>
                            <SelectItem value="resuelto">Resuelto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel-incident"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-incident"
                  >
                    {createMutation.isPending ? "Creando..." : "Crear Incidencia"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {Array.from(new Set(incidents.map(i => i.category))).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user?.role === "admin_fincas" && (
            <Select value={communityFilter} onValueChange={setCommunityFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-community">
                <SelectValue placeholder="Comunidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las comunidades</SelectItem>
                {communities.map((comm) => (
                  <SelectItem key={comm.id} value={comm.id}>{comm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Desde:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                  data-testid="button-filter-date-from"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PP", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {dateFrom && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDateFrom(undefined)}
                data-testid="button-clear-date-from"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hasta:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                  data-testid="button-filter-date-to"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PP", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {dateTo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDateTo(undefined)}
                data-testid="button-clear-date-to"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIncidents.map((incident) => (
              <div key={incident.id} className="relative group">
                <IncidentCard
                  id={incident.id}
                  title={incident.title}
                  status={incident.status}
                  priority={incident.priority}
                  category={incident.category}
                  reporter="Usuario"
                  date={new Date(incident.createdAt).toLocaleDateString('es-ES')}
                  onClick={() => console.log('Incident clicked:', incident.id)}
                />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-incident-menu-${incident.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {incident.status !== "resuelto" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(incident.id, "resuelto")}
                          data-testid={`button-resolve-incident-${incident.id}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como resuelto
                        </DropdownMenuItem>
                      )}
                      {incident.status !== "en_curso" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(incident.id, "en_curso")}
                          data-testid={`button-in-progress-incident-${incident.id}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar en curso
                        </DropdownMenuItem>
                      )}
                      {incident.status !== "pendiente" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(incident.id, "pendiente")}
                          data-testid={`button-pending-incident-${incident.id}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como pendiente
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(incident.id)}
                        className="text-destructive"
                        data-testid={`button-delete-incident-${incident.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {filteredIncidents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron incidencias</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
