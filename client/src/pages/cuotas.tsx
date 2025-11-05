import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuotaTypeSchema, insertQuotaAssignmentSchema, type QuotaType, type QuotaAssignment } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCommunity } from "@/hooks/use-auth";
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, Clock, Euro, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const quotaTypeFormSchema = insertQuotaTypeSchema.omit({ communityId: true });
type QuotaTypeFormValues = z.infer<typeof quotaTypeFormSchema>;

const quotaAssignmentFormSchema = insertQuotaAssignmentSchema.omit({ communityId: true }).extend({
  dueDate: z.date(),
});
type QuotaAssignmentFormValues = z.infer<typeof quotaAssignmentFormSchema>;

type User = {
  id: string;
  fullName: string | null;
  email: string;
  unitNumber: string | null;
  role: string;
};

export default function Cuotas() {
  const [activeTab, setActiveTab] = useState("types");
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<QuotaType | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<QuotaAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { data: currentCommunity } = useCurrentCommunity();

  const { data: quotaTypes = [], isLoading: loadingTypes } = useQuery<QuotaType[]>({
    queryKey: ["/api/quota-types"],
  });

  const { data: quotaAssignments = [], isLoading: loadingAssignments } = useQuery<QuotaAssignment[]>({
    queryKey: ["/api/quota-assignments"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const vecinos = useMemo(() => users.filter(u => u.role === "vecino"), [users]);

  const typeForm = useForm<QuotaTypeFormValues>({
    resolver: zodResolver(quotaTypeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: "0",
      frequency: "mensual",
      isActive: true,
    },
  });

  const assignmentForm = useForm<QuotaAssignmentFormValues>({
    resolver: zodResolver(quotaAssignmentFormSchema),
    defaultValues: {
      quotaTypeId: "",
      userId: "",
      status: "pendiente",
      amount: "0",
      dueDate: new Date(),
      paidDate: null,
      notes: "",
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: QuotaTypeFormValues & { communityId: string }) => {
      const res = await apiRequest("POST", "/api/quota-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-types"] });
      toast({
        title: "Tipo de cuota creado",
        description: "El tipo de cuota se ha creado correctamente",
      });
      setTypeDialogOpen(false);
      typeForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuotaTypeFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/quota-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-types"] });
      toast({
        title: "Tipo de cuota actualizado",
        description: "El tipo de cuota se ha actualizado correctamente",
      });
      setTypeDialogOpen(false);
      setEditingType(null);
      typeForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/quota-types/${id}`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-types"] });
      toast({
        title: "Tipo de cuota eliminado",
        description: "El tipo de cuota se ha eliminado correctamente",
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

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: QuotaAssignmentFormValues & { communityId: string }) => {
      const res = await apiRequest("POST", "/api/quota-assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      toast({
        title: "Cuota asignada",
        description: "La cuota se ha asignado correctamente al vecino",
      });
      setAssignmentDialogOpen(false);
      assignmentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuotaAssignmentFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/quota-assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      toast({
        title: "Asignación actualizada",
        description: "La asignación de cuota se ha actualizado correctamente",
      });
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
      assignmentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/quota-assignments/${id}`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      toast({
        title: "Asignación eliminada",
        description: "La asignación se ha eliminado correctamente",
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

  const onSubmitType = (data: QuotaTypeFormValues) => {
    if (!currentCommunity?.id) {
      toast({
        title: "Error",
        description: "No hay una comunidad seleccionada",
        variant: "destructive",
      });
      return;
    }
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate({ ...data, communityId: currentCommunity.id });
    }
  };

  const onSubmitAssignment = (data: QuotaAssignmentFormValues) => {
    if (!currentCommunity?.id) {
      toast({
        title: "Error",
        description: "No hay una comunidad seleccionada",
        variant: "destructive",
      });
      return;
    }
    if (editingAssignment) {
      updateAssignmentMutation.mutate({ id: editingAssignment.id, data });
    } else {
      createAssignmentMutation.mutate({ ...data, communityId: currentCommunity.id });
    }
  };

  const handleEditType = (type: QuotaType) => {
    setEditingType(type);
    typeForm.reset({
      name: type.name,
      description: type.description || "",
      amount: type.amount,
      frequency: type.frequency,
      isActive: type.isActive,
    });
    setTypeDialogOpen(true);
  };

  const handleDeleteType = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este tipo de cuota?")) {
      deleteTypeMutation.mutate(id);
    }
  };

  const handleNewType = () => {
    setEditingType(null);
    typeForm.reset({
      name: "",
      description: "",
      amount: "0",
      frequency: "mensual",
      isActive: true,
    });
    setTypeDialogOpen(true);
  };

  const handleEditAssignment = (assignment: QuotaAssignment) => {
    setEditingAssignment(assignment);
    assignmentForm.reset({
      quotaTypeId: assignment.quotaTypeId,
      userId: assignment.userId,
      status: assignment.status,
      amount: assignment.amount,
      dueDate: new Date(assignment.dueDate),
      paidDate: assignment.paidDate ? new Date(assignment.paidDate) : null,
      notes: assignment.notes || "",
    });
    setAssignmentDialogOpen(true);
  };

  const handleDeleteAssignment = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta asignación?")) {
      deleteAssignmentMutation.mutate(id);
    }
  };

  const handleNewAssignment = () => {
    setEditingAssignment(null);
    assignmentForm.reset({
      quotaTypeId: "",
      userId: "",
      status: "pendiente",
      amount: "0",
      dueDate: new Date(),
      paidDate: null,
      notes: "",
    });
    setAssignmentDialogOpen(true);
  };

  const filteredTypes = useMemo(() => {
    return quotaTypes.filter((type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotaTypes, searchTerm]);

  const filteredAssignments = useMemo(() => {
    return quotaAssignments.filter((assignment) => {
      const quotaType = quotaTypes.find(t => t.id === assignment.quotaTypeId);
      const user = users.find(u => u.id === assignment.userId);
      const searchLower = searchTerm.toLowerCase();
      return (
        quotaType?.name.toLowerCase().includes(searchLower) ||
        user?.fullName?.toLowerCase().includes(searchLower) ||
        user?.email.toLowerCase().includes(searchLower)
      );
    });
  }, [quotaAssignments, quotaTypes, users, searchTerm]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pendiente: { variant: "secondary", icon: Clock },
      pagada: { variant: "default", icon: CheckCircle },
      deudor: { variant: "destructive", icon: AlertCircle },
    };
    const config = variants[status] || variants.pendiente;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      mensual: "Mensual",
      trimestral: "Trimestral",
      semestral: "Semestral",
      anual: "Anual",
      unica: "Única",
    };
    return labels[frequency] || frequency;
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-cuotas">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Cuotas</h1>
          <p className="text-muted-foreground">
            Gestiona los tipos de cuotas y asignaciones a vecinos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="types" data-testid="tab-quota-types">
            Tipos de Cuotas
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-quota-assignments">
            Asignaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Input
              placeholder="Buscar tipo de cuota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-quota-types"
            />
            <Button onClick={handleNewType} data-testid="button-new-quota-type">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tipo
            </Button>
          </div>

          {loadingTypes ? (
            <p>Cargando tipos de cuotas...</p>
          ) : filteredTypes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No hay tipos de cuotas definidos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTypes.map((type) => (
                <Card key={type.id} className="hover-elevate" data-testid={`card-quota-type-${type.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditType(type)}
                        data-testid={`button-edit-quota-type-${type.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteType(type.id)}
                        data-testid={`button-delete-quota-type-${type.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {type.description && (
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-semibold text-lg">
                        <Euro className="w-4 h-4" />
                        {type.amount}
                      </div>
                      <Badge variant="outline">{getFrequencyLabel(type.frequency)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Input
              placeholder="Buscar asignación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-quota-assignments"
            />
            <Button onClick={handleNewAssignment} data-testid="button-new-quota-assignment">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Asignación
            </Button>
          </div>

          {loadingAssignments ? (
            <p>Cargando asignaciones...</p>
          ) : filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No hay asignaciones de cuotas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAssignments.map((assignment) => {
                const quotaType = quotaTypes.find(t => t.id === assignment.quotaTypeId);
                const user = users.find(u => u.id === assignment.userId);
                return (
                  <Card key={assignment.id} className="hover-elevate" data-testid={`card-quota-assignment-${assignment.id}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{quotaType?.name || "Tipo desconocido"}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {user?.fullName || user?.email} {user?.unitNumber && `- Unidad ${user.unitNumber}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditAssignment(assignment)}
                          data-testid={`button-edit-quota-assignment-${assignment.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          data-testid={`button-delete-quota-assignment-${assignment.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1 font-semibold">
                          <Euro className="w-4 h-4" />
                          {assignment.amount}
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                        <div className="text-muted-foreground">
                          Vence: {format(new Date(assignment.dueDate), "dd/MM/yyyy", { locale: es })}
                        </div>
                        {assignment.paidDate && (
                          <div className="text-muted-foreground">
                            Pagado: {format(new Date(assignment.paidDate), "dd/MM/yyyy", { locale: es })}
                          </div>
                        )}
                      </div>
                      {assignment.notes && (
                        <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? "Editar Tipo de Cuota" : "Nuevo Tipo de Cuota"}</DialogTitle>
          </DialogHeader>
          <Form {...typeForm}>
            <form onSubmit={typeForm.handleSubmit(onSubmitType)} className="space-y-4">
              <FormField
                control={typeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cuota ordinaria" data-testid="input-quota-type-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción opcional" data-testid="input-quota-type-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importe (€) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="100.00" data-testid="input-quota-type-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-quota-type-frequency">
                          <SelectValue placeholder="Selecciona la frecuencia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="unica">Única</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTypeDialogOpen(false)}
                  data-testid="button-cancel-quota-type"
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-submit-quota-type">
                  {editingType ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Editar Asignación" : "Nueva Asignación"}</DialogTitle>
          </DialogHeader>
          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
              <FormField
                control={assignmentForm.control}
                name="quotaTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cuota *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-quota-type">
                          <SelectValue placeholder="Selecciona el tipo de cuota" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quotaTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} - {type.amount}€
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vecino *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-user">
                          <SelectValue placeholder="Selecciona el vecino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vecinos.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.fullName || user.email} {user.unitNumber && `- Unidad ${user.unitNumber}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importe (€) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="100.00" data-testid="input-assignment-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Vencimiento *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                            data-testid="button-select-due-date"
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-status">
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="pagada">Pagada</SelectItem>
                        <SelectItem value="deudor">Deudor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Notas opcionales" data-testid="input-assignment-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignmentDialogOpen(false)}
                  data-testid="button-cancel-assignment"
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-submit-assignment">
                  {editingAssignment ? "Actualizar" : "Asignar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
