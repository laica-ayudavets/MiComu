import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DerramaCard } from "@/components/derrama-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, Edit, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Derrama, InsertDerrama } from "@shared/schema";
import { insertDerramaSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  totalAmount: z.string().min(1, "El monto es requerido"),
  dueDate: z.date({ required_error: "La fecha de vencimiento es requerida" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Derramas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDerrama, setEditingDerrama] = useState<Derrama | null>(null);
  const { toast } = useToast();

  const { data: derramas = [], isLoading } = useQuery<Derrama[]>({
    queryKey: ["/api/derramas"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      totalAmount: "",
      dueDate: new Date(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/derramas", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/derramas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Derrama creada",
        description: "La derrama se ha creado correctamente",
      });
      setDialogOpen(false);
      setEditingDerrama(null);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormValues> }) => {
      const res = await apiRequest("PATCH", `/api/derramas/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/derramas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Derrama actualizada",
        description: "La derrama se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingDerrama(null);
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
      await apiRequest("DELETE", `/api/derramas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/derramas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Derrama eliminada",
        description: "La derrama se ha eliminado correctamente",
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

  const filteredDerramas = useMemo(() => {
    return derramas.filter((derrama) =>
      searchTerm === "" ||
      derrama.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [derramas, searchTerm]);

  const onSubmit = (data: FormValues) => {
    if (editingDerrama) {
      updateMutation.mutate({ id: editingDerrama.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (derrama: Derrama) => {
    setEditingDerrama(derrama);
    form.reset({
      title: derrama.title,
      description: derrama.description || "",
      totalAmount: derrama.totalAmount,
      dueDate: new Date(derrama.dueDate),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta derrama?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewDerrama = () => {
    setEditingDerrama(null);
    form.reset({
      title: "",
      description: "",
      totalAmount: "",
      dueDate: new Date(),
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-derramas">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Derramas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de derramas y pagos extraordinarios
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewDerrama} data-testid="button-new-derrama">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Derrama
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDerrama ? "Editar Derrama" : "Nueva Derrama"}
              </DialogTitle>
              <DialogDescription>
                {editingDerrama
                  ? "Actualiza los detalles de la derrama"
                  : "Crea una nueva derrama para la comunidad"}
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
                          placeholder="Ej: Reparación de fachada"
                          {...field}
                          data-testid="input-derrama-title"
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
                          placeholder="Describe los detalles de la derrama..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-derrama-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Total (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="15000.00"
                            {...field}
                            data-testid="input-derrama-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-derrama-duedate"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
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
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingDerrama(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-derrama"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-derrama"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? editingDerrama
                        ? "Actualizando..."
                        : "Creando..."
                      : editingDerrama
                      ? "Actualizar Derrama"
                      : "Crear Derrama"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar derramas..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-derramas"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDerramas.map((derrama) => (
              <div key={derrama.id} className="relative group">
                <DerramaCard
                  id={derrama.id}
                  title={derrama.title}
                  amount={parseFloat(derrama.totalAmount)}
                  collected={parseFloat(derrama.collectedAmount)}
                  membersTotal={30}
                  membersPaid={Math.round((parseFloat(derrama.collectedAmount) / parseFloat(derrama.totalAmount)) * 30)}
                  dueDate={format(new Date(derrama.dueDate), "dd MMM yyyy", { locale: es })}
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        data-testid={`button-derrama-menu-${derrama.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEdit(derrama)}
                        data-testid={`button-edit-derrama-${derrama.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(derrama.id)}
                        className="text-destructive"
                        data-testid={`button-delete-derrama-${derrama.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {filteredDerramas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron derramas</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
