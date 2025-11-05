import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DocumentCard } from "@/components/document-card";
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
import { Upload, Search, MoreVertical, Trash2, CalendarIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Document, InsertDocument } from "@shared/schema";
import { insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCommunities, useUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const formSchema = insertDocumentSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  type: z.string().min(1, "El tipo es requerido"),
  fileUrl: z.string().min(1, "La URL del documento es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Documentos() {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [communityFilter, setCommunityFilter] = useState("todas");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const { toast } = useToast();
  const { data: user } = useUser();
  const { data: communities = [] } = useCommunities();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      fileUrl: "",
      tenantId: "default-tenant",
      fileSize: null,
      uploadedBy: null,
      isAnalyzed: false,
      analysisResult: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Documento creado",
        description: "El documento se ha creado correctamente",
      });
      setDialogOpen(false);
      setEditingDocument(null);
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
      const res = await apiRequest("PATCH", `/api/documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Documento actualizado",
        description: "El documento se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingDocument(null);
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
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente",
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

  const filteredDocuments = useMemo(() => {
    const endOfSelectedDay = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999) : undefined;
    
    return documents.filter((doc) => {
      const matchesFilter = filter === "todos" || doc.type === filter;
      const matchesSearch =
        searchTerm === "" ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCommunity = communityFilter === "todas" || doc.communityId === communityFilter;
      
      const docDate = new Date(doc.createdAt);
      const matchesDateFrom = !dateFrom || docDate >= dateFrom;
      const matchesDateTo = !endOfSelectedDay || docDate <= endOfSelectedDay;
      
      return matchesFilter && matchesSearch && matchesCommunity && matchesDateFrom && matchesDateTo;
    });
  }, [documents, filter, searchTerm, communityFilter, dateFrom, dateTo]);

  const onSubmit = (data: FormValues) => {
    if (editingDocument) {
      updateMutation.mutate({ id: editingDocument.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    form.reset({
      title: document.title,
      description: document.description || "",
      type: document.type,
      fileUrl: document.fileUrl,
      tenantId: document.tenantId,
      fileSize: document.fileSize,
      uploadedBy: document.uploadedBy,
      isAnalyzed: document.isAnalyzed || false,
      analysisResult: document.analysisResult,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este documento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewDocument = () => {
    setEditingDocument(null);
    form.reset({
      title: "",
      description: "",
      type: "",
      fileUrl: "",
      tenantId: "default-tenant",
      fileSize: null,
      uploadedBy: null,
      isAnalyzed: false,
      analysisResult: null,
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-documentos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y analiza documentos con IA
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewDocument} data-testid="button-upload-document">
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? "Editar Documento" : "Nuevo Documento"}
              </DialogTitle>
              <DialogDescription>
                {editingDocument 
                  ? "Actualiza la información del documento"
                  : "Crea un nuevo documento para la comunidad"}
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
                          placeholder="Ej: Acta Ordinaria Enero 2025"
                          {...field}
                          data-testid="input-document-title"
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
                          placeholder="Describe el documento..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-document-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="acta">Acta</SelectItem>
                            <SelectItem value="presupuesto">Presupuesto</SelectItem>
                            <SelectItem value="certificado">Certificado</SelectItem>
                            <SelectItem value="contrato">Contrato</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Documento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="URL del documento"
                            {...field}
                            data-testid="input-document-url"
                          />
                        </FormControl>
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
                      setEditingDocument(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-document"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-document"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <span className="mr-2">⏳</span>
                    )}
                    {editingDocument ? "Actualizar" : "Crear"}
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
              placeholder="Buscar documentos..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-documents"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="acta">Actas</SelectItem>
              <SelectItem value="presupuesto">Presupuestos</SelectItem>
              <SelectItem value="certificado">Certificados</SelectItem>
              <SelectItem value="contrato">Contratos</SelectItem>
              <SelectItem value="otro">Otros</SelectItem>
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full" data-testid={`skeleton-document-${i}`} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="relative group">
                <DocumentCard
                  id={document.id}
                  title={document.title}
                  type={document.type as "acta" | "contrato" | "factura" | "otro"}
                  date={format(new Date(document.createdAt), "d MMM yyyy")}
                  hasAIAnalysis={document.isAnalyzed || false}
                  onView={() => window.open(document.fileUrl, "_blank")}
                  onDownload={() => {
                    const link = window.document.createElement("a");
                    link.href = document.fileUrl;
                    link.download = document.title;
                    link.click();
                  }}
                  onAnalyze={() => {
                    toast({
                      title: "Análisis iniciado",
                      description: "El análisis del documento se procesará próximamente",
                    });
                  }}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-document-menu-${document.id}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEdit(document)}
                      data-testid={`button-edit-${document.id}`}
                    >
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(document.id)}
                      className="text-destructive"
                      data-testid={`button-delete-${document.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron documentos</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
