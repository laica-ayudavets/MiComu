import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuotaTypeSchema, insertQuotaAssignmentSchema, type QuotaType, type QuotaAssignment, type Community } from "@shared/schema";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCommunity, useUser, useCommunities } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, Clock, Euro, CalendarIcon, FileText, Users, Zap, Building2, Search, User, Receipt, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const quotaTypeFormSchema = insertQuotaTypeSchema.omit({ communityId: true, propertyCompanyId: true }).extend({
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

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const YEARS = ["2024", "2025", "2026"];

const TAX_OPTIONS = [
  { value: "0", label: "0% (Sin IVA)" },
  { value: "4", label: "4% (Superreducido)" },
  { value: "10", label: "10% (Reducido)" },
  { value: "21", label: "21% (General)" },
];

function PredictiveVecinoSearch({
  vecinos,
  value,
  onSelect,
  placeholder = "Buscar vecino...",
  testId = "search-vecino",
}: {
  vecinos: User[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredVecinos = useMemo(() => {
    if (!search) return vecinos;
    const searchLower = search.toLowerCase();
    return vecinos.filter(
      (v) =>
        v.fullName?.toLowerCase().includes(searchLower) ||
        v.email.toLowerCase().includes(searchLower) ||
        v.unitNumber?.toLowerCase().includes(searchLower)
    );
  }, [vecinos, search]);

  const selectedVecino = vecinos.find((v) => v.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          data-testid={testId}
        >
          {selectedVecino ? (
            <span className="truncate">
              {selectedVecino.fullName || selectedVecino.email}
              {selectedVecino.unitNumber && ` - ${selectedVecino.unitNumber}`}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre, email o unidad..."
            value={search}
            onValueChange={setSearch}
            data-testid={`${testId}-input`}
          />
          <CommandList>
            <CommandEmpty>No se encontraron vecinos</CommandEmpty>
            <CommandGroup>
              {filteredVecinos.map((vecino) => (
                <CommandItem
                  key={vecino.id}
                  value={vecino.id}
                  onSelect={() => {
                    onSelect(vecino.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  data-testid={`${testId}-option-${vecino.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium">
                        {vecino.fullName || vecino.email}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {vecino.email}
                        {vecino.unitNumber && ` · Unidad ${vecino.unitNumber}`}
                      </span>
                    </div>
                  </div>
                  {value === vecino.id && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PredictiveCommunitySearch({
  communities,
  selectedIds,
  onToggle,
  testId = "search-community",
}: {
  communities: Community[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  testId?: string;
}) {
  const [search, setSearch] = useState("");

  const filteredCommunities = useMemo(() => {
    if (!search) return communities;
    const searchLower = search.toLowerCase();
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.address?.toLowerCase().includes(searchLower) ||
        c.city?.toLowerCase().includes(searchLower)
    );
  }, [communities, search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar comunidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid={`${testId}-input`}
        />
      </div>
      <div className="rounded-md border p-3 max-h-48 overflow-y-auto space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            id="select-all-communities"
            checked={selectedIds.length === communities.length && communities.length > 0}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;
              if (isChecked) {
                communities.forEach((c) => onToggle(c.id, true));
              } else {
                communities.forEach((c) => onToggle(c.id, false));
              }
            }}
            data-testid="checkbox-select-all-communities"
          />
          <label htmlFor="select-all-communities" className="text-sm font-medium cursor-pointer">
            Seleccionar todas ({filteredCommunities.length})
          </label>
        </div>
        {filteredCommunities.map((community) => (
          <div key={community.id} className="flex items-center gap-2">
            <Checkbox
              id={`community-${community.id}`}
              checked={selectedIds.includes(community.id)}
              onCheckedChange={(checked) => onToggle(community.id, checked === true)}
              data-testid={`checkbox-community-${community.id}`}
            />
            <label htmlFor={`community-${community.id}`} className="text-sm cursor-pointer flex-1 truncate">
              {community.name}
            </label>
          </div>
        ))}
        {filteredCommunities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No se encontraron comunidades
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedIds.length} comunidad(es) seleccionada(s)
      </p>
    </div>
  );
}

function TaxCalculationPreview({
  baseAmount,
  taxPercentage,
}: {
  baseAmount: string;
  taxPercentage: string;
}) {
  const base = parseFloat(baseAmount) || 0;
  const tax = parseFloat(taxPercentage) || 0;
  
  if (base <= 0) return null;

  const taxAmount = base * tax / 100;
  const total = base + taxAmount;

  return (
    <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Base imponible:</span>
        <span className="font-medium">{base.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">IVA ({taxPercentage}%):</span>
        <span className="font-medium">{taxAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between border-t pt-1">
        <span className="font-medium">Total a pagar:</span>
        <span className="font-bold">{total.toFixed(2)}€</span>
      </div>
    </div>
  );
}

export default function Cuotas() {
  const [activeTab, setActiveTab] = useState("overview");
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<QuotaType | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<QuotaAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [generateMonthlyDialogOpen, setGenerateMonthlyDialogOpen] = useState(false);
  const [individualDialogOpen, setIndividualDialogOpen] = useState(false);
  const [freeFormDialogOpen, setFreeFormDialogOpen] = useState(false);
  const [multiCommunityDialogOpen, setMultiCommunityDialogOpen] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [baseAmount, setBaseAmount] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [selectedQuotaTypeId, setSelectedQuotaTypeId] = useState<string>("");
  
  const [selectedVecinoId, setSelectedVecinoId] = useState<string>("");
  const [individualNotes, setIndividualNotes] = useState("");
  
  const [freeFormVecinoId, setFreeFormVecinoId] = useState<string>("");
  const [freeFormConcept, setFreeFormConcept] = useState("");
  const [freeFormBaseAmount, setFreeFormBaseAmount] = useState("");
  const [freeFormTaxPercentage, setFreeFormTaxPercentage] = useState("0");
  const [freeFormDueDate, setFreeFormDueDate] = useState<Date>(new Date());
  const [freeFormNotes, setFreeFormNotes] = useState("");
  
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<string[]>([]);
  const [multiQuotaTypeName, setMultiQuotaTypeName] = useState("");
  
  const { toast } = useToast();
  const { data: currentCommunity } = useCurrentCommunity();
  const { data: currentUser } = useUser();
  const { data: allCommunities = [] } = useCommunities();

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

  const vecinos = useMemo(() => users.filter((u) => u.role === "vecino"), [users]);

  const activeQuotaTypes = useMemo(
    () => quotaTypes.filter((t) => t.isActive),
    [quotaTypes]
  );

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
    mutationFn: async (data: QuotaTypeFormValues & { communityId?: string | null }) => {
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
    mutationFn: async ({
      month,
      year,
      baseAmount,
      taxPercent,
      quotaTypeId,
    }: {
      month: string;
      year: string;
      baseAmount: string;
      taxPercent: string;
      quotaTypeId: string;
    }) => {
      const baseAmountNum = parseFloat(baseAmount);
      const taxPercentNum = parseFloat(taxPercent);
      
      if (!Number.isFinite(baseAmountNum) || baseAmountNum <= 0) {
        throw new Error("El importe debe ser un número válido mayor que 0");
      }
      if (!Number.isFinite(taxPercentNum) || taxPercentNum < 0) {
        throw new Error("El porcentaje de impuesto debe ser un número válido");
      }
      
      const res = await apiRequest("POST", "/api/invoices/generate-monthly", {
        month,
        year,
        baseAmount: baseAmountNum,
        taxPercentage: taxPercentNum,
        quotaTypeId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quota-types"] });
      setGenerateMonthlyDialogOpen(false);
      resetGenerateMonthlyForm();
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

  const generateIndividualMutation = useMutation({
    mutationFn: async ({
      userId,
      quotaTypeId,
      baseAmount,
      taxPercent,
      month,
      year,
      notes,
    }: {
      userId: string;
      quotaTypeId: string;
      baseAmount: string;
      taxPercent: string;
      month: string;
      year: string;
      notes?: string;
    }) => {
      const baseAmountNum = parseFloat(baseAmount);
      const taxPercentNum = parseFloat(taxPercent);
      
      if (!Number.isFinite(baseAmountNum) || baseAmountNum <= 0) {
        throw new Error("El importe debe ser un número válido mayor que 0");
      }
      if (!Number.isFinite(taxPercentNum) || taxPercentNum < 0) {
        throw new Error("El porcentaje de impuesto debe ser un número válido");
      }
      
      const res = await apiRequest("POST", "/api/invoices/generate-individual", {
        userId,
        quotaTypeId,
        month,
        year,
        baseAmount: baseAmountNum,
        taxPercentage: taxPercentNum,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      setIndividualDialogOpen(false);
      resetIndividualForm();
      toast({
        title: "Cuota generada",
        description: "Se ha creado la cuota individual correctamente",
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

  const generateFreeFormMutation = useMutation({
    mutationFn: async ({
      userId,
      concept,
      baseAmount,
      taxPercent,
      dueDate,
      notes,
    }: {
      userId: string;
      concept: string;
      baseAmount: string;
      taxPercent: string;
      dueDate: Date;
      notes?: string;
    }) => {
      const baseAmountNum = parseFloat(baseAmount);
      const taxPercentNum = parseFloat(taxPercent);
      
      if (!Number.isFinite(baseAmountNum) || baseAmountNum <= 0) {
        throw new Error("El importe debe ser un número válido mayor que 0");
      }
      if (!Number.isFinite(taxPercentNum) || taxPercentNum < 0) {
        throw new Error("El porcentaje de impuesto debe ser un número válido");
      }
      
      const res = await apiRequest("POST", "/api/invoices/generate-freeform", {
        userId,
        concept,
        baseAmount: baseAmountNum,
        taxPercentage: taxPercentNum,
        dueDate: dueDate.toISOString(),
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      setFreeFormDialogOpen(false);
      resetFreeFormForm();
      toast({
        title: "Factura creada",
        description: "Se ha creado la factura libre correctamente",
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

  const generateMultiCommunityMutation = useMutation({
    mutationFn: async ({
      communityIds,
      quotaTypeName,
      baseAmount,
      taxPercent,
      month,
      year,
    }: {
      communityIds: string[];
      quotaTypeName: string;
      baseAmount: string;
      taxPercent: string;
      month: string;
      year: string;
    }) => {
      const baseAmountNum = parseFloat(baseAmount);
      const taxPercentNum = parseFloat(taxPercent);
      
      if (!Number.isFinite(baseAmountNum) || baseAmountNum <= 0) {
        throw new Error("El importe debe ser un número válido mayor que 0");
      }
      if (!Number.isFinite(taxPercentNum) || taxPercentNum < 0) {
        throw new Error("El porcentaje de impuesto debe ser un número válido");
      }
      
      const res = await apiRequest("POST", "/api/invoices/generate-multi-community", {
        communityIds,
        quotaTypeName,
        month,
        year,
        baseAmount: baseAmountNum,
        taxPercentage: taxPercentNum,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quota-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quota-types"] });
      setMultiCommunityDialogOpen(false);
      resetMultiCommunityForm();
      toast({
        title: "Cuotas generadas",
        description: `Se han generado cuotas en ${data.communitiesProcessed} comunidades. Total: ${data.totalCreated} cuotas creadas.`,
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

  const resetGenerateMonthlyForm = useCallback(() => {
    setSelectedMonth(String(new Date().getMonth() + 1));
    setSelectedYear(String(new Date().getFullYear()));
    setBaseAmount("");
    setTaxPercentage("0");
    setSelectedQuotaTypeId("");
  }, []);

  const resetIndividualForm = useCallback(() => {
    setSelectedVecinoId("");
    setSelectedQuotaTypeId("");
    setBaseAmount("");
    setTaxPercentage("0");
    setSelectedMonth(String(new Date().getMonth() + 1));
    setSelectedYear(String(new Date().getFullYear()));
    setIndividualNotes("");
  }, []);

  const resetFreeFormForm = useCallback(() => {
    setFreeFormVecinoId("");
    setFreeFormConcept("");
    setFreeFormBaseAmount("");
    setFreeFormTaxPercentage("0");
    setFreeFormDueDate(new Date());
    setFreeFormNotes("");
  }, []);

  const resetMultiCommunityForm = useCallback(() => {
    setSelectedCommunityIds([]);
    setMultiQuotaTypeName("");
    setBaseAmount("");
    setTaxPercentage("0");
    setSelectedMonth(String(new Date().getMonth() + 1));
    setSelectedYear(String(new Date().getFullYear()));
  }, []);

  const onSubmitType = (data: QuotaTypeFormValues) => {
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate({ ...data, communityId: currentCommunity?.id || null });
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
      taxPercentage: "0",
      frequency: "mensual",
      isActive: true,
    });
    setTypeDialogOpen(true);
  };

  const handleEditAssignment = (assignment: QuotaAssignment) => {
    setEditingAssignment(assignment);
    assignmentForm.reset({
      quotaTypeId: assignment.quotaTypeId || "",
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

  const handleCommunityToggle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCommunityIds((prev) => [...prev.filter((i) => i !== id), id]);
    } else {
      setSelectedCommunityIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const filteredTypes = useMemo(() => {
    return quotaTypes.filter((type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotaTypes, searchTerm]);

  const filteredAssignments = useMemo(() => {
    return quotaAssignments.filter((assignment) => {
      const quotaType = quotaTypes.find((t) => t.id === assignment.quotaTypeId);
      const user = users.find((u) => u.id === assignment.userId);
      const searchLower = searchTerm.toLowerCase();
      return (
        quotaType?.name.toLowerCase().includes(searchLower) ||
        user?.fullName?.toLowerCase().includes(searchLower) ||
        user?.email.toLowerCase().includes(searchLower) ||
        assignment.concept?.toLowerCase().includes(searchLower)
      );
    });
  }, [quotaAssignments, quotaTypes, users, searchTerm]);

  const stats = useMemo(() => {
    const pending = quotaAssignments.filter((a) => a.status === "pendiente").length;
    const paid = quotaAssignments.filter((a) => a.status === "pagada").length;
    const overdue = quotaAssignments.filter((a) => a.status === "vencida").length;
    const totalAmount = quotaAssignments.reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);
    const paidAmount = quotaAssignments
      .filter((a) => a.status === "pagada")
      .reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);
    return { pending, paid, overdue, totalAmount, paidAmount };
  }, [quotaAssignments]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
      pendiente: { variant: "secondary", icon: Clock },
      pagada: { variant: "default", icon: CheckCircle },
      vencida: { variant: "destructive", icon: AlertCircle },
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-paid">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="stat-overdue">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recaudado</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-collected">
              {stats.paidAmount.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalAmount.toFixed(2)}€ total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-quota-assignments">
            Asignaciones
          </TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-quota-types">
            Tipos de Cuotas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold">Generación de Cuotas</h2>
              <p className="text-sm text-muted-foreground">
                Crea cuotas para los vecinos de forma rápida y sencilla
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{vecinos.length}</span> vecinos activos
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setGenerateMonthlyDialogOpen(true)}
                data-testid="card-generate-monthly"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-5 w-5 text-primary" />
                    Cuota Mensual
                  </CardTitle>
                  <CardDescription>
                    Genera cuotas para todos los vecinos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setIndividualDialogOpen(true)}
                data-testid="card-generate-individual"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5 text-primary" />
                    Cuota Individual
                  </CardTitle>
                  <CardDescription>
                    Crea una cuota para un vecino específico
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setFreeFormDialogOpen(true)}
                data-testid="card-generate-freeform"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5 text-primary" />
                    Factura Libre
                  </CardTitle>
                  <CardDescription>
                    Crea un cargo sin tipo de cuota
                  </CardDescription>
                </CardHeader>
              </Card>

              {allCommunities.length > 1 && (
                <Card 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setMultiCommunityDialogOpen(true)}
                  data-testid="card-generate-multi-community"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-5 w-5 text-primary" />
                      Multi-Comunidad
                    </CardTitle>
                    <CardDescription>
                      Genera en múltiples comunidades
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          )}

          {activeQuotaTypes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="font-medium text-center">No hay tipos de cuota activos</p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Crea un tipo de cuota para poder generar cuotas a los vecinos
                </p>
                <Button className="mt-4" onClick={handleNewType} data-testid="button-create-first-quota-type">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Tipo de Cuota
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h3 className="text-sm font-medium mb-3">Tipos de Cuota Disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeQuotaTypes.map((type) => (
                  <Card key={type.id} data-testid={`card-quota-type-${type.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{type.name}</CardTitle>
                      {type.description && (
                        <CardDescription>{type.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold">{type.amount}€</span>
                          {parseFloat(type.taxPercentage || "0") > 0 && (
                            <span className="text-sm text-muted-foreground ml-1">
                              +{type.taxPercentage}% IVA
                            </span>
                          )}
                        </div>
                        <Badge variant="outline">{getFrequencyLabel(type.frequency)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar asignaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-assignments"
              />
            </div>
            {isAdmin && (
              <Button onClick={handleNewAssignment} data-testid="button-new-assignment">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Asignación
              </Button>
            )}
          </div>

          {loadingAssignments ? (
            <p className="text-muted-foreground">Cargando asignaciones...</p>
          ) : filteredAssignments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="font-medium">No hay asignaciones</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? "No se encontraron resultados" : "Genera cuotas para ver las asignaciones aquí"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => {
                const quotaType = quotaTypes.find((t) => t.id === assignment.quotaTypeId);
                const user = users.find((u) => u.id === assignment.userId);
                return (
                  <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {user?.fullName || user?.email || "Usuario desconocido"}
                            </span>
                            {user?.unitNumber && (
                              <Badge variant="outline" className="shrink-0">
                                Unidad {user.unitNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {quotaType?.name || assignment.concept || "Cargo"}
                            {assignment.periodMonth && assignment.periodYear && (
                              <span> · {MONTHS.find((m) => m.value === String(assignment.periodMonth))?.label} {assignment.periodYear}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold">{parseFloat(assignment.amount).toFixed(2)}€</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {format(new Date(assignment.dueDate), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                        {getStatusBadge(assignment.status)}
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0">
                            {assignment.status === "pendiente" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => markPaidMutation.mutate({ id: assignment.id })}
                                data-testid={`button-mark-paid-${assignment.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditAssignment(assignment)}
                              data-testid={`button-edit-assignment-${assignment.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              data-testid={`button-delete-assignment-${assignment.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipos de cuota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-types"
              />
            </div>
            {isAdmin && (
              <Button onClick={handleNewType} data-testid="button-new-quota-type">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tipo
              </Button>
            )}
          </div>

          {loadingTypes ? (
            <p className="text-muted-foreground">Cargando tipos de cuota...</p>
          ) : filteredTypes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="font-medium">No hay tipos de cuota</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? "No se encontraron resultados" : "Crea tu primer tipo de cuota"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTypes.map((type) => (
                <Card key={type.id} data-testid={`card-type-${type.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{type.name}</CardTitle>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {type.description && (
                      <CardDescription>{type.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold">{type.amount}€</span>
                        {parseFloat(type.taxPercentage || "0") > 0 && (
                          <span className="text-sm text-muted-foreground ml-1">
                            +{type.taxPercentage}% IVA
                          </span>
                        )}
                      </div>
                      <Badge variant="outline">{getFrequencyLabel(type.frequency)}</Badge>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditType(type)}
                          data-testid={`button-edit-type-${type.id}`}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteType(type.id)}
                          data-testid={`button-delete-type-${type.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? "Editar Tipo de Cuota" : "Nuevo Tipo de Cuota"}</DialogTitle>
            <DialogDescription>
              {editingType
                ? "Modifica los datos del tipo de cuota"
                : "Crea un nuevo tipo de cuota para tu comunidad"}
            </DialogDescription>
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
                      <Input {...field} placeholder="Ej: Cuota Ordinaria" data-testid="input-quota-type-name" />
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
                    <FormLabel>Importe Base (sin IVA) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="100.00" data-testid="input-quota-type-amount" />
                    </FormControl>
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
                        {TAX_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
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
                    <FormLabel>Tipo de Cuota</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-quota-type">
                          <SelectValue placeholder="Selecciona el tipo (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin tipo específico</SelectItem>
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
                    <FormControl>
                      <PredictiveVecinoSearch
                        vecinos={vecinos}
                        value={field.value}
                        onSelect={field.onChange}
                        testId="select-assignment-user"
                      />
                    </FormControl>
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
                        <SelectItem value="vencida">Vencida</SelectItem>
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

      <Dialog
        open={generateMonthlyDialogOpen}
        onOpenChange={(open) => {
          setGenerateMonthlyDialogOpen(open);
          if (!open) resetGenerateMonthlyForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Cuota Mensual</DialogTitle>
            <DialogDescription>
              Genera cuotas para todos los vecinos activos de la comunidad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Cuota *</label>
              <Select value={selectedQuotaTypeId} onValueChange={setSelectedQuotaTypeId}>
                <SelectTrigger data-testid="select-monthly-quota-type">
                  <SelectValue placeholder="Selecciona un tipo de cuota" />
                </SelectTrigger>
                <SelectContent>
                  {activeQuotaTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.amount}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mes *</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger data-testid="select-monthly-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Año *</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger data-testid="select-monthly-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Base Imponible (sin IVA) *</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="0.00"
                  className="pr-8"
                  data-testid="input-monthly-base-amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IVA (%)</label>
              <Select value={taxPercentage} onValueChange={setTaxPercentage}>
                <SelectTrigger data-testid="select-monthly-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TaxCalculationPreview baseAmount={baseAmount} taxPercentage={taxPercentage} />

            <div className="rounded-md border p-3 space-y-1 text-sm bg-muted/30">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comunidad:</span>
                <span className="font-medium">{currentCommunity?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vecinos activos:</span>
                <span className="font-medium">{vecinos.length}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateMonthlyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                generateMonthlyMutation.mutate({
                  month: selectedMonth,
                  year: selectedYear,
                  baseAmount,
                  taxPercent: taxPercentage,
                  quotaTypeId: selectedQuotaTypeId,
                })
              }
              disabled={
                generateMonthlyMutation.isPending ||
                !selectedQuotaTypeId ||
                !baseAmount ||
                parseFloat(baseAmount) <= 0
              }
              data-testid="button-confirm-monthly"
            >
              {generateMonthlyMutation.isPending ? "Generando..." : "Confirmar y Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={individualDialogOpen}
        onOpenChange={(open) => {
          setIndividualDialogOpen(open);
          if (!open) resetIndividualForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Cuota Individual</DialogTitle>
            <DialogDescription>
              Crea una cuota para un vecino específico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vecino *</label>
              <PredictiveVecinoSearch
                vecinos={vecinos}
                value={selectedVecinoId}
                onSelect={(id) => setSelectedVecinoId(id)}
                testId="search-individual-vecino"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Cuota *</label>
              <Select
                value={selectedQuotaTypeId}
                onValueChange={(value) => {
                  setSelectedQuotaTypeId(value);
                  const qt = activeQuotaTypes.find((t) => t.id === value);
                  if (qt) {
                    setBaseAmount(qt.amount);
                    setTaxPercentage(qt.taxPercentage || "0");
                  }
                }}
              >
                <SelectTrigger data-testid="select-individual-quota-type">
                  <SelectValue placeholder="Selecciona un tipo de cuota" />
                </SelectTrigger>
                <SelectContent>
                  {activeQuotaTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.amount}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mes *</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger data-testid="select-individual-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Año *</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger data-testid="select-individual-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Base Imponible (sin IVA) *</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="0.00"
                  className="pr-8"
                  data-testid="input-individual-base-amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IVA (%)</label>
              <Select value={taxPercentage} onValueChange={setTaxPercentage}>
                <SelectTrigger data-testid="select-individual-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TaxCalculationPreview baseAmount={baseAmount} taxPercentage={taxPercentage} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={individualNotes}
                onChange={(e) => setIndividualNotes(e.target.value)}
                placeholder="Notas adicionales..."
                data-testid="input-individual-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIndividualDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                generateIndividualMutation.mutate({
                  userId: selectedVecinoId,
                  quotaTypeId: selectedQuotaTypeId,
                  month: selectedMonth,
                  year: selectedYear,
                  baseAmount,
                  taxPercent: taxPercentage,
                  notes: individualNotes || undefined,
                })
              }
              disabled={
                generateIndividualMutation.isPending ||
                !selectedVecinoId ||
                !selectedQuotaTypeId ||
                !baseAmount ||
                parseFloat(baseAmount) <= 0
              }
              data-testid="button-confirm-individual"
            >
              {generateIndividualMutation.isPending ? "Generando..." : "Generar Cuota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={freeFormDialogOpen}
        onOpenChange={(open) => {
          setFreeFormDialogOpen(open);
          if (!open) resetFreeFormForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Factura Libre</DialogTitle>
            <DialogDescription>
              Crea un cargo puntual sin asociar a un tipo de cuota
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vecino *</label>
              <PredictiveVecinoSearch
                vecinos={vecinos}
                value={freeFormVecinoId}
                onSelect={(id) => setFreeFormVecinoId(id)}
                testId="search-freeform-vecino"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Concepto *</label>
              <Input
                value={freeFormConcept}
                onChange={(e) => setFreeFormConcept(e.target.value)}
                placeholder="Ej: Reparación caldera, Limpieza extraordinaria..."
                data-testid="input-freeform-concept"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Base Imponible (sin IVA) *</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={freeFormBaseAmount}
                  onChange={(e) => setFreeFormBaseAmount(e.target.value)}
                  placeholder="0.00"
                  className="pr-8"
                  data-testid="input-freeform-base-amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IVA (%)</label>
              <Select value={freeFormTaxPercentage} onValueChange={setFreeFormTaxPercentage}>
                <SelectTrigger data-testid="select-freeform-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TaxCalculationPreview baseAmount={freeFormBaseAmount} taxPercentage={freeFormTaxPercentage} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Vencimiento *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full pl-3 text-left font-normal"
                    data-testid="button-freeform-due-date"
                  >
                    {freeFormDueDate ? (
                      format(freeFormDueDate, "dd/MM/yyyy", { locale: es })
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={freeFormDueDate}
                    onSelect={(date) => date && setFreeFormDueDate(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={freeFormNotes}
                onChange={(e) => setFreeFormNotes(e.target.value)}
                placeholder="Notas adicionales..."
                data-testid="input-freeform-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreeFormDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                generateFreeFormMutation.mutate({
                  userId: freeFormVecinoId,
                  concept: freeFormConcept,
                  baseAmount: freeFormBaseAmount,
                  taxPercent: freeFormTaxPercentage,
                  dueDate: freeFormDueDate,
                  notes: freeFormNotes || undefined,
                })
              }
              disabled={
                generateFreeFormMutation.isPending ||
                !freeFormVecinoId ||
                !freeFormConcept ||
                !freeFormBaseAmount ||
                parseFloat(freeFormBaseAmount) <= 0
              }
              data-testid="button-confirm-freeform"
            >
              {generateFreeFormMutation.isPending ? "Creando..." : "Crear Factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={multiCommunityDialogOpen}
        onOpenChange={(open) => {
          setMultiCommunityDialogOpen(open);
          if (!open) resetMultiCommunityForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generación Multi-Comunidad</DialogTitle>
            <DialogDescription>
              Genera cuotas para múltiples comunidades a la vez
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comunidades *</label>
              <PredictiveCommunitySearch
                communities={allCommunities}
                selectedIds={selectedCommunityIds}
                onToggle={handleCommunityToggle}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Cuota (nombre) *</label>
              <Input
                value={multiQuotaTypeName}
                onChange={(e) => setMultiQuotaTypeName(e.target.value)}
                placeholder="Ej: Cuota Ordinaria Mensual"
                data-testid="input-multi-quota-type-name"
              />
              <p className="text-xs text-muted-foreground">
                Se creará un tipo de cuota con este nombre en cada comunidad si no existe
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mes *</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger data-testid="select-multi-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Año *</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger data-testid="select-multi-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Base Imponible (sin IVA) *</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="0.00"
                  className="pr-8"
                  data-testid="input-multi-base-amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IVA (%)</label>
              <Select value={taxPercentage} onValueChange={setTaxPercentage}>
                <SelectTrigger data-testid="select-multi-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TaxCalculationPreview baseAmount={baseAmount} taxPercentage={taxPercentage} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMultiCommunityDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                generateMultiCommunityMutation.mutate({
                  communityIds: selectedCommunityIds,
                  quotaTypeName: multiQuotaTypeName,
                  month: selectedMonth,
                  year: selectedYear,
                  baseAmount,
                  taxPercent: taxPercentage,
                })
              }
              disabled={
                generateMultiCommunityMutation.isPending ||
                selectedCommunityIds.length === 0 ||
                !multiQuotaTypeName ||
                !baseAmount ||
                parseFloat(baseAmount) <= 0
              }
              data-testid="button-confirm-multi-community"
            >
              {generateMultiCommunityMutation.isPending
                ? "Generando..."
                : `Generar en ${selectedCommunityIds.length} Comunidades`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
