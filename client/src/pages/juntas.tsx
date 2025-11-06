import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, CalendarIcon, FileText, Users, MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Meeting, InsertMeeting } from "@shared/schema";
import { insertMeetingSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCommunities, useUser, useCurrentCommunity } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const formSchema = insertMeetingSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  location: z.string().min(1, "El lugar es requerido"),
  scheduledDate: z.date({ required_error: "La fecha es requerida" }),
  communityId: z.string().min(1, "Debe seleccionar una comunidad"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Juntas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [communityFilter, setCommunityFilter] = useState("todas");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: user } = useUser();
  const { data: communities = [] } = useCommunities();
  const { data: currentCommunity } = useCurrentCommunity();
  const [_, setLocation] = useLocation();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityId: currentCommunity?.id || "",
      type: "ordinaria",
      title: "",
      description: "",
      scheduledDate: new Date(),
      location: "",
      status: "convocada",
      minutesContent: "",
      minutesApproved: false,
      createdBy: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/meetings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Junta creada",
        description: "La junta se ha creado correctamente",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Junta eliminada",
        description: "La junta se ha eliminado correctamente",
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

  const filteredMeetings = useMemo(() => {
    const endOfSelectedDay = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999) : undefined;
    
    return meetings.filter((meeting) => {
      const matchesSearch =
        searchTerm === "" ||
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (meeting.location && meeting.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === "todas" || meeting.type === typeFilter;
      const matchesStatus = statusFilter === "todas" || meeting.status === statusFilter;
      const matchesCommunity = communityFilter === "todas" || meeting.communityId === communityFilter;
      
      const matchesDateFrom = !dateFrom || new Date(meeting.scheduledDate) >= dateFrom;
      const matchesDateTo = !endOfSelectedDay || new Date(meeting.scheduledDate) <= endOfSelectedDay;

      return matchesSearch && matchesType && matchesStatus && matchesCommunity && matchesDateFrom && matchesDateTo;
    });
  }, [meetings, searchTerm, typeFilter, statusFilter, communityFilter, dateFrom, dateTo]);

  const handleSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta junta?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "convocada":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Convocada</Badge>;
      case "celebrada":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Celebrada</Badge>;
      case "cancelada":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "ordinaria" ? (
      <Badge variant="outline">Ordinaria</Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700">Extraordinaria</Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Juntas de Vecinos</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las convocatorias, actas y asistencias de las juntas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-meeting">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Junta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Junta</DialogTitle>
                <DialogDescription>
                  Crea una convocatoria para una nueva junta de vecinos
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {user?.role === "admin_fincas" && (
                    <FormField
                      control={form.control}
                      name="communityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comunidad *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-community">
                                <SelectValue placeholder="Seleccionar comunidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {communities.map((community) => (
                                <SelectItem key={community.id} value={community.id}>
                                  {community.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Junta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ordinaria">Ordinaria</SelectItem>
                            <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Junta Ordinaria Trimestre 1 2025"
                            data-testid="input-title"
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
                        <FormLabel>Descripción (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Descripción de la junta..."
                            className="resize-none"
                            rows={3}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha y Hora</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-select-date"
                              >
                                {field.value ? (
                                  format(field.value, "PPP 'a las' HH:mm", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={es}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lugar</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Salón de actos de la comunidad"
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createMutation.isPending ? "Creando..." : "Crear Junta"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar juntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-filter-date-from">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "P", { locale: es }) : "Desde"}
                  {dateFrom && (
                    <X
                      className="ml-2 h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateFrom(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-filter-date-to">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "P", { locale: es }) : "Hasta"}
                  {dateTo && (
                    <X
                      className="ml-2 h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateTo(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {user?.role === "admin_fincas" && (
              <Select value={communityFilter} onValueChange={setCommunityFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-community">
                  <SelectValue placeholder="Comunidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las comunidades</SelectItem>
                  {communities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los tipos</SelectItem>
                <SelectItem value="ordinaria">Ordinaria</SelectItem>
                <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los estados</SelectItem>
                <SelectItem value="convocada">Convocada</SelectItem>
                <SelectItem value="celebrada">Celebrada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 pt-0">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Users className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No hay juntas</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || typeFilter !== "todas" || statusFilter !== "todas" || communityFilter !== "todas" || dateFrom || dateTo
                    ? "No se encontraron juntas con los filtros aplicados"
                    : "Comienza creando una nueva junta"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <Card
                key={meeting.id}
                className="hover-elevate active-elevate-2 cursor-pointer transition-all"
                onClick={() => setLocation(`/juntas/${meeting.id}`)}
                data-testid={`card-meeting-${meeting.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(meeting.type)}
                      {getStatusBadge(meeting.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {meeting.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{format(new Date(meeting.scheduledDate), "PPP 'a las' HH:mm", { locale: es })}</span>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{meeting.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/juntas/${meeting.id}`);
                      }}
                      data-testid={`button-view-${meeting.id}`}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Ver detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
