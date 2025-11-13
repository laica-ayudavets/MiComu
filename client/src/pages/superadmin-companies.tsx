import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PropertyCompany {
  id: string;
  name: string;
  cif: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

const companySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  cif: z.string().min(1, "El CIF es obligatorio"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function SuperadminCompanies() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<PropertyCompany | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<PropertyCompany | null>(null);

  const { data: companies = [], isLoading } = useQuery<PropertyCompany[]>({
    queryKey: ["/api/superadmin/property-companies"],
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      cif: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest("POST", "/api/superadmin/property-companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/property-companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      toast({
        title: "Empresa creada",
        description: "La empresa de gestión se ha creado correctamente",
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      return apiRequest("PATCH", `/api/superadmin/property-companies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/property-companies"] });
      toast({
        title: "Empresa actualizada",
        description: "La empresa de gestión se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingCompany(null);
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
      return apiRequest("DELETE", `/api/superadmin/property-companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/property-companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      toast({
        title: "Empresa eliminada",
        description: "La empresa de gestión se ha eliminado correctamente",
      });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "No se puede eliminar",
        description: error.message || "Esta empresa tiene comunidades o administradores asociados",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
  });

  const handleSubmit = (data: CompanyFormData) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company: PropertyCompany) => {
    setEditingCompany(company);
    form.reset({
      name: company.name,
      cif: company.cif,
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
    });
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCompany(null);
    form.reset({
      name: "",
      cif: "",
      address: "",
      phone: "",
      email: "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (company: PropertyCompany) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    company.cif.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] min-h-full" data-testid="page-superadmin-companies">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas de Gestión</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las empresas de gestión de fincas y sus detalles
          </p>
        </div>
        <Button onClick={handleCreateNew} data-testid="button-create-company">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>Busca y gestiona todas las empresas de gestión</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o CIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-companies"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron empresas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cif}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.email || company.phone || "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(company)}
                        data-testid={`button-edit-${company.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(company)}
                        data-testid={`button-delete-${company.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-company-form">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Editar Empresa de Gestión" : "Crear Nueva Empresa de Gestión"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany
                ? "Actualiza los detalles de la empresa de gestión"
                : "Introduce los detalles de la nueva empresa de gestión"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CIF/NIF *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-cif" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-company-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingCompany(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-company"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Eliminar Empresa de Gestión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{companyToDelete?.name}"? Esta acción no se puede deshacer si no hay comunidades o administradores asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCompanyToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => companyToDelete && deleteMutation.mutate(companyToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
