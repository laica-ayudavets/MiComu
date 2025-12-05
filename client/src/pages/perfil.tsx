import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, UserCircle, Mail, Phone, Home, Building2, Receipt, Euro, Calendar, CheckCircle, Clock, AlertTriangle, FileText, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import type { QuotaAssignment, QuotaType } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Perfil() {
  const { data: user, isLoading } = useUser();
  const { toast } = useToast();

  // Fetch user's quota assignments (invoices/payments)
  const { data: quotaAssignments = [], isLoading: loadingQuotas } = useQuery<QuotaAssignment[]>({
    queryKey: ["/api/quota-assignments/me"],
    enabled: !!user && (user.role === "vecino" || user.role === "presidente"),
  });

  // Fetch quota types for display
  const { data: quotaTypes = [] } = useQuery<QuotaType[]>({
    queryKey: ["/api/quota-types"],
    enabled: !!user && (user.role === "vecino" || user.role === "presidente"),
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/users/me", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Perfil actualizado",
        description: "Tu información de contacto ha sido actualizada correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // State for tracking which PDF is downloading
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Download PDF for a quota assignment
  const downloadPdf = async (quotaId: string, docNumber?: string | null) => {
    setDownloadingPdf(quotaId);
    try {
      const response = await fetch(`/api/quota-assignments/${quotaId}/pdf`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al descargar");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${docNumber || quotaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF descargado",
        description: "La factura se ha descargado correctamente.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error al descargar PDF",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      superadmin: { label: "Super Administrador", variant: "default" },
      admin_fincas: { label: "Administrador de Fincas", variant: "default" },
      presidente: { label: "Presidente", variant: "secondary" },
      vecino: { label: "Vecino", variant: "outline" },
    };
    const roleInfo = roleLabels[role] || { label: role, variant: "outline" };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pagada":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pagada
          </Badge>
        );
      case "deudor":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Deudor
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  // Get Holded status badge
  const getHoldedStatusBadge = (holdedStatus: number | null) => {
    if (holdedStatus === null || holdedStatus === undefined) {
      return null;
    }
    switch (holdedStatus) {
      case 0:
        return (
          <Badge variant="outline" className="text-xs">
            Borrador
          </Badge>
        );
      case 1:
        return (
          <Badge variant="secondary" className="text-xs">
            Pendiente
          </Badge>
        );
      case 2:
        return (
          <Badge variant="default" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Pagada
          </Badge>
        );
      case 3:
        return (
          <Badge variant="destructive" className="text-xs">
            Vencida
          </Badge>
        );
      default:
        return null;
    }
  };

  // Calculate totals for summary
  const pendingQuotas = quotaAssignments.filter(q => q.status === "pendiente");
  const paidQuotas = quotaAssignments.filter(q => q.status === "pagada");
  const totalPending = pendingQuotas.reduce((sum, q) => sum + parseFloat(q.amount || "0"), 0);
  const totalPaid = paidQuotas.reduce((sum, q) => sum + parseFloat(q.amount || "0"), 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="page-perfil-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isResident = user?.role === "vecino" || user?.role === "presidente";

  return (
    <div className="p-6 space-y-6" data-testid="page-perfil">
      <div>
        <h1 className="text-3xl font-semibold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu información personal y de contacto
        </p>
      </div>

      {isResident ? (
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <UserCircle className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              <Receipt className="w-4 h-4 mr-2" />
              Mis Cuotas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu nombre y datos de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Tu nombre"
                          data-testid="input-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Tu apellido"
                          data-testid="input-lastname"
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="tu@email.com"
                          data-testid="input-email"
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder="+34 600 000 000"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Información de Cuenta
            </CardTitle>
            <CardDescription>
              Datos de tu cuenta y comunidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Usuario</p>
              <p className="text-sm" data-testid="text-username">{user?.username}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Rol</p>
              <div data-testid="text-role">{user && getRoleBadge(user.role)}</div>
            </div>

            {user?.unitNumber && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Unidad / Vivienda
                </p>
                <p className="text-sm" data-testid="text-unit">{user.unitNumber}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge variant={user?.active ? "default" : "secondary"} data-testid="text-status">
                {user?.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Si necesitas cambiar tu contraseña o unidad, contacta con tu administrador de fincas.
              </p>
            </div>
          </CardContent>
        </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pendiente de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-pending-total">
                    {totalPending.toFixed(2)}€
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pendingQuotas.length} cuota{pendingQuotas.length !== 1 && "s"} pendiente{pendingQuotas.length !== 1 && "s"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Total Pagado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-paid-total">
                    {totalPaid.toFixed(2)}€
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paidQuotas.length} cuota{paidQuotas.length !== 1 && "s"} pagada{paidQuotas.length !== 1 && "s"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Total Cuotas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-quotas">
                    {quotaAssignments.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuotas registradas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Quotas */}
            {pendingQuotas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                    Cuotas Pendientes
                  </CardTitle>
                  <CardDescription>
                    Cuotas que requieren pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingQuotas.map((quota) => {
                      const quotaType = quotaTypes.find(t => t.id === quota.quotaTypeId);
                      return (
                        <div 
                          key={quota.id} 
                          className="flex items-center justify-between p-4 rounded-md border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
                          data-testid={`quota-pending-${quota.id}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{quotaType?.name || "Cuota"}</p>
                              {quota.holdedDocNumber && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {quota.holdedDocNumber}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{quota.notes}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Vencimiento: {quota.dueDate ? new Date(quota.dueDate).toLocaleDateString("es-ES") : "Sin fecha"}
                              </div>
                              {quota.holdedInvoiceId && (
                                <div className="flex items-center gap-1">
                                  <Receipt className="w-3 h-3" />
                                  <span className="text-primary">Factura en Holded</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                              <div className="text-lg font-bold flex items-center justify-end gap-1">
                                <Euro className="w-4 h-4" />
                                {quota.amount}
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                {getStatusBadge(quota.status)}
                                {getHoldedStatusBadge(quota.holdedStatus)}
                              </div>
                            </div>
                            {quota.holdedInvoiceId && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => downloadPdf(quota.id, quota.holdedDocNumber)}
                                disabled={downloadingPdf === quota.id}
                                data-testid={`button-download-pdf-${quota.id}`}
                                title="Descargar factura PDF"
                              >
                                {downloadingPdf === quota.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paid Quotas History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Historial de Pagos
                </CardTitle>
                <CardDescription>
                  Registro de todas tus cuotas pagadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingQuotas ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : paidQuotas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No hay pagos registrados aún
                  </p>
                ) : (
                  <div className="space-y-2">
                    {paidQuotas.map((quota) => {
                      const quotaType = quotaTypes.find(t => t.id === quota.quotaTypeId);
                      return (
                        <div 
                          key={quota.id} 
                          className="flex items-center justify-between p-3 rounded-md border bg-green-50/50 dark:bg-green-950/30"
                          data-testid={`quota-paid-${quota.id}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{quotaType?.name || "Cuota"}</p>
                              {quota.holdedDocNumber && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {quota.holdedDocNumber}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{quota.notes}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {quota.paidDate && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  Pagado: {new Date(quota.paidDate).toLocaleDateString("es-ES")}
                                </div>
                              )}
                              {quota.holdedInvoiceId && (
                                <div className="flex items-center gap-1">
                                  <Receipt className="w-3 h-3" />
                                  <span className="text-primary">Factura en Holded</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{quota.amount}€</span>
                            <div className="flex flex-col gap-1 items-end">
                              {getStatusBadge(quota.status)}
                              {getHoldedStatusBadge(quota.holdedStatus)}
                            </div>
                            {quota.holdedInvoiceId && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => downloadPdf(quota.id, quota.holdedDocNumber)}
                                disabled={downloadingPdf === quota.id}
                                data-testid={`button-download-pdf-${quota.id}`}
                                title="Descargar factura PDF"
                              >
                                {downloadingPdf === quota.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
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
        </Tabs>
      ) : (
        // Non-resident users (admin_fincas, superadmin) see the simple profile view
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu nombre y datos de contacto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Tu nombre"
                            data-testid="input-firstname-admin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Tu apellido"
                            data-testid="input-lastname-admin"
                          />
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
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Correo Electrónico
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="tu@email.com"
                            data-testid="input-email-admin"
                          />
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
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Teléfono
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            placeholder="+34 600 000 000"
                            data-testid="input-phone-admin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile-admin"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información de Cuenta
              </CardTitle>
              <CardDescription>
                Datos de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                <p className="text-sm" data-testid="text-username-admin">{user?.username}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <div data-testid="text-role-admin">{user && getRoleBadge(user.role)}</div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <Badge variant={user?.active ? "default" : "secondary"} data-testid="text-status-admin">
                  {user?.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
