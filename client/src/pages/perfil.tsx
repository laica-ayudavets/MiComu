import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, UserCircle, Mail, Phone, Home, Building2 } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Perfil() {
  const { data: user, isLoading } = useUser();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName || "",
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

  return (
    <div className="p-6 space-y-6" data-testid="page-perfil">
      <div>
        <h1 className="text-3xl font-semibold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu información personal y de contacto
        </p>
      </div>

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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Tu nombre completo"
                          data-testid="input-fullname"
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
    </div>
  );
}
