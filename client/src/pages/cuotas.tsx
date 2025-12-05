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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCommunity, useUser } from "@/hooks/use-auth";
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, Clock, Euro, CalendarIcon, FileText, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const quotaTypeFormSchema = insertQuotaTypeSchema.omit({ communityId: true }).extend({
  description: z.string().optional().transform(val => val || ""),
});
type QuotaTypeFormValues = z.infer<typeof quotaTypeFormSchema>;

const quotaAssignmentFormSchema = insertQuotaAssignmentSchema.omit({ communityId: true }).extend({
  dueDate: z.date(),
  notes: z.string().optional().transform(val => val || ""),
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
  const [activeTab, setActiveTab] = useState("generate");
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<QuotaType | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<QuotaAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [baseAmount, setBaseAmount] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [selectedQuotaType, setSelectedQuotaType] = useState<QuotaType | null>(null);
  const { toast } = useToast();
  const { data: currentCommunity } = useCurrentCommunity();
  const { data: currentUser } = useUser();
  
  const isAdmin = currentUser?.role === "admin_fincas";

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
      taxPercentage: "0",
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

  const generateMonthlyMutation = useMutation({
    mutationFn: async ({ month, year, baseAmount, taxPercent, quotaTypeId }: { month: string; year: string; baseAmount: string; taxPercent: string; quotaTypeId: string }) => {
      const res = await apiRequest("POST", "/api/invoices/generate-monthly", { 
        month, 
        year,
        baseAmount: parseFloat(baseAmount),
        taxPercentage: parseFloat(taxPercent),
        quotaTypeId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quota-types"] });
      setGenerateDialogOpen(false);
      toast({
        title: "Cuotas generadas",
        description: `Se han creado ${data.created} cuotas. ${data.skipped > 0 ? `${data.skipped} ya existían.` : ""}`,
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

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, paidDate }: { id: string; paidDate?: Date }) => {
      const res = await apiRequest("POST", `/api/quota-assignments/${id}/mark-paid`, { paidDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      toast({
        title: "Pago registrado",
        description: "La cuota se ha marcado como pagada",
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
      taxPercentage: type.taxPercentage || "0",
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
          <TabsTrigger value="generate" data-testid="tab-generate">
            Generar Cuotas
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-quota-assignments">
            Asignaciones
          </TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-quota-types">
            Tipos de Cuotas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Generación de Cuotas</h2>
              <p className="text-sm text-muted-foreground">
                Selecciona el periodo y genera cuotas para los vecinos activos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{vecinos.filter(v => users.find(u => u.id === v.id)).length}</span> vecinos activos
              </span>
            </div>
          </div>
          
          <div className="flex items-end gap-4 flex-wrap p-4 rounded-lg border bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mes</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Enero</SelectItem>
                  <SelectItem value="2">Febrero</SelectItem>
                  <SelectItem value="3">Marzo</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Mayo</SelectItem>
                  <SelectItem value="6">Junio</SelectItem>
                  <SelectItem value="7">Julio</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Septiembre</SelectItem>
                  <SelectItem value="10">Octubre</SelectItem>
                  <SelectItem value="11">Noviembre</SelectItem>
                  <SelectItem value="12">Diciembre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loadingTypes ? (
            <p className="text-muted-foreground">Cargando tipos de cuota...</p>
          ) : quotaTypes.filter(t => t.isActive).length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">No hay tipos de cuota activos</p>
              </div>
              <p className="mt-1 text-sm">
                Crea al menos un tipo de cuota en la pestaña "Tipos de Cuotas" para poder generar cuotas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quotaTypes.filter(t => t.isActive).map((quotaType) => {
                const baseAmount = parseFloat(quotaType.amount);
                const taxPercent = parseFloat(quotaType.taxPercentage || "0");
                const totalAmount = baseAmount * (1 + taxPercent / 100);
                
                return (
                  <Card key={quotaType.id} className="hover-elevate">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="w-4 h-4" />
                        {quotaType.name}
                      </CardTitle>
                      {quotaType.description && (
                        <CardDescription className="text-xs">
                          {quotaType.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base imponible:</span>
                          <span className="font-medium">{baseAmount.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA ({taxPercent}%):</span>
                          <span className="font-medium">{(baseAmount * taxPercent / 100).toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold text-primary">{totalAmount.toFixed(2)}€</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Frecuencia: {quotaType.frequency}</span>
                      </div>
                      {isAdmin && (
                        <Button 
                          className="w-full"
                          onClick={() => {
                            setBaseAmount(quotaType.amount);
                            setTaxPercentage(quotaType.taxPercentage || "0");
                            setSelectedQuotaType(quotaType);
                            setGenerateDialogOpen(true);
                          }}
                          disabled={generateMonthlyMutation.isPending}
                          data-testid={`button-generate-${quotaType.id}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Generar para {["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][parseInt(selectedMonth)]}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cuotas Recientes</CardTitle>
              <CardDescription>
                Últimas cuotas generadas para esta comunidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : quotaAssignments.length === 0 ? (
                <p className="text-muted-foreground">No hay cuotas generadas aún</p>
              ) : (
                <div className="space-y-2">
                  {quotaAssignments.slice(0, 5).map((assignment) => {
                    const user = users.find(u => u.id === assignment.userId);
                    const quotaType = quotaTypes.find(t => t.id === assignment.quotaTypeId);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="space-y-1">
                          <p className="font-medium">{user?.fullName || user?.email}</p>
                          <p className="text-sm text-muted-foreground">{quotaType?.name} - {assignment.notes}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{assignment.amount}€</span>
                          {getStatusBadge(assignment.status)}
                          {isAdmin && assignment.status === "pendiente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markPaidMutation.mutate({ id: assignment.id })}
                              disabled={markPaidMutation.isPending}
                              data-testid={`button-mark-paid-${assignment.id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Marcar Pagado
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                    <FormLabel>Base Imponible (€) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="100.00" data-testid="input-quota-type-amount" />
                    </FormControl>
                    <FormDescription>Importe antes de impuestos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="taxPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IVA (%)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "0"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-quota-type-tax">
                          <SelectValue placeholder="Selecciona el IVA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0% (Sin IVA)</SelectItem>
                        <SelectItem value="4">4% (Superreducido)</SelectItem>
                        <SelectItem value="10">10% (Reducido)</SelectItem>
                        <SelectItem value="21">21% (General)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Las cuotas de comunidad normalmente no llevan IVA</FormDescription>
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

      <Dialog open={generateDialogOpen} onOpenChange={(open) => {
        setGenerateDialogOpen(open);
        if (!open) {
          setSelectedQuotaType(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Cuotas: {selectedQuotaType?.name}</DialogTitle>
            <DialogDescription>
              Confirma los datos y genera las cuotas para todos los vecinos activos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comunidad:</span>
                <span className="font-medium">{currentCommunity?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo de cuota:</span>
                <span className="font-medium">{selectedQuotaType?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mes/Año:</span>
                <span className="font-medium">
                  {["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][parseInt(selectedMonth)]} {selectedYear}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Imponible (sin IVA)</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    placeholder="0.00"
                    className="pr-8"
                    data-testid="input-base-amount"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Introduce el importe antes de impuestos. El total se calculará automáticamente.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Porcentaje de IVA</label>
                <div className="relative">
                  <Select value={taxPercentage} onValueChange={setTaxPercentage}>
                    <SelectTrigger data-testid="select-tax-percentage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Sin IVA)</SelectItem>
                      <SelectItem value="4">4% (IVA Superreducido)</SelectItem>
                      <SelectItem value="10">10% (IVA Reducido)</SelectItem>
                      <SelectItem value="21">21% (IVA General)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Las cuotas de comunidad normalmente no llevan IVA (0%).
                </p>
              </div>
              
              {baseAmount && parseFloat(baseAmount) > 0 && (
                <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base imponible:</span>
                    <span className="font-medium">
                      {parseFloat(baseAmount).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({taxPercentage}%):</span>
                    <span className="font-medium">
                      {(parseFloat(baseAmount) * parseFloat(taxPercentage) / 100).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Total a pagar:</span>
                    <span className="font-bold">{(parseFloat(baseAmount) * (1 + parseFloat(taxPercentage) / 100)).toFixed(2)}€</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedQuotaType && generateMonthlyMutation.mutate({ 
                month: selectedMonth, 
                year: selectedYear,
                baseAmount: baseAmount,
                taxPercent: taxPercentage,
                quotaTypeId: selectedQuotaType.id,
              })}
              disabled={generateMonthlyMutation.isPending || !baseAmount || parseFloat(baseAmount) <= 0}
              data-testid="button-confirm-generate"
            >
              {generateMonthlyMutation.isPending ? "Generando..." : "Confirmar y Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
