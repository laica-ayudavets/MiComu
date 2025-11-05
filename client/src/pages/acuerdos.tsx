import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AgreementCard } from "@/components/agreement-card";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, CheckCircle, XCircle, Clock, CalendarIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Agreement, InsertAgreement } from "@shared/schema";
import { insertAgreementSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCommunities, useUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const formSchema = insertAgreementSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  deadline: z.coerce.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Acuerdos() {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [communityFilter, setCommunityFilter] = useState("todas");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: user } = useUser();
  const { data: communities = [] } = useCommunities();

  const { data: agreements = [], isLoading } = useQuery<Agreement[]>({
    queryKey: ["/api/agreements"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      responsible: "",
      deadline: null,
      status: "pendiente",
      tenantId: "default-tenant",
      documentId: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/agreements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      toast({
        title: "Acuerdo creado",
        description: "El acuerdo se ha creado correctamente",
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
      const res = await apiRequest("PATCH", `/api/agreements/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del acuerdo se ha actualizado correctamente",
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
      await apiRequest("DELETE", `/api/agreements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      toast({
        title: "Acuerdo eliminado",
        description: "El acuerdo se ha eliminado correctamente",
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

  const filteredAgreements = useMemo(() => {
    const endOfSelectedDay = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999) : undefined;
    
    return agreements.filter((agreement) => {
      const matchesFilter = filter === "todos" || agreement.status === filter;
      const matchesSearch =
        searchTerm === "" ||
        agreement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.responsible && agreement.responsible.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCommunity = communityFilter === "todas" || agreement.communityId === communityFilter;
      
      const agreementDate = new Date(agreement.createdAt);
      const matchesDateFrom = !dateFrom || agreementDate >= dateFrom;
      const matchesDateTo = !endOfSelectedDay || agreementDate <= endOfSelectedDay;
      
      return matchesFilter && matchesSearch && matchesCommunity && matchesDateFrom && matchesDateTo;
    });
  }, [agreements, filter, searchTerm, communityFilter, dateFrom, dateTo]);

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este acuerdo?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-acuerdos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Acuerdos</h1>
          <p className="text-muted-foreground mt-1">
            Seguimiento de acuerdos y compromisos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-agreement">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Acuerdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Acuerdo</DialogTitle>
              <DialogDescription>
                Crea un nuevo acuerdo para la comunidad
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
                          placeholder="Ej: Instalar cámaras de seguridad"
                          {...field}
                          data-testid="input-agreement-title"
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
                          placeholder="Describe el acuerdo en detalle..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          data-testid="input-agreement-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: SeguridadTotal S.L."
                            {...field}
                            value={field.value || ""}
                            data-testid="input-agreement-responsible"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha límite</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                data-testid="input-agreement-deadline"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(new Date(field.value), "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <SelectTrigger data-testid="select-agreement-status">
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="aprobado">Aprobado</SelectItem>
                          <SelectItem value="rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel-agreement"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-agreement"
                  >
                    {createMutation.isPending ? "Creando..." : "Crear Acuerdo"}
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
              <SelectItem value="aprobado">Aprobados</SelectItem>
              <SelectItem value="rechazado">Rechazados</SelectItem>
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
            {filteredAgreements.map((agreement) => (
              <div key={agreement.id} className="relative group">
                <AgreementCard
                  id={agreement.id}
                  title={agreement.title}
                  responsible={agreement.responsible}
                  deadline={agreement.deadline}
                  status={agreement.status}
                  description={agreement.description}
                />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-agreement-menu-${agreement.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(agreement.id, "pendiente")}
                        disabled={agreement.status === "pendiente"}
                        data-testid={`button-status-pendiente-${agreement.id}`}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Marcar Pendiente
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(agreement.id, "aprobado")}
                        disabled={agreement.status === "aprobado"}
                        data-testid={`button-status-aprobado-${agreement.id}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar Aprobado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(agreement.id, "rechazado")}
                        disabled={agreement.status === "rechazado"}
                        data-testid={`button-status-rechazado-${agreement.id}`}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Marcar Rechazado
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(agreement.id)}
                        className="text-destructive focus:text-destructive"
                        data-testid={`button-delete-agreement-${agreement.id}`}
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

          {filteredAgreements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron acuerdos</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
