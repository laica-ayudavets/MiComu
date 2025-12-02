import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Pencil, 
  Key, 
  UserX, 
  UserCheck, 
  Users, 
  Search,
  Eye,
  EyeOff
} from "lucide-react";
import type { User, Community } from "@shared/schema";

const userFormSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
  unitNumber: z.string().optional(),
  role: z.enum(["vecino", "presidente"]),
  communityId: z.string().min(1, "Selecciona una comunidad"),
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const editUserFormSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
  unitNumber: z.string().optional(),
  role: z.enum(["vecino", "presidente"]),
});

const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userFormSchema>;
type EditUserFormData = z.infer<typeof editUserFormSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Vecinos() {
  const { data: currentUser } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [reactivateUser, setReactivateUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users"],
  });

  const { data: communities, isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const addForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      unitNumber: "",
      role: "vecino",
      communityId: "",
      username: "",
      password: "",
    },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserFormSchema),
    values: editingUser ? {
      fullName: editingUser.fullName || "",
      email: editingUser.email,
      phone: editingUser.phone || "",
      unitNumber: editingUser.unitNumber || "",
      role: editingUser.role as "vecino" | "presidente",
    } : {
      fullName: "",
      email: "",
      phone: "",
      unitNumber: "",
      role: "vecino",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("POST", "/api/users", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudo crear el vecino");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      setShowPassword(false);
      toast({
        title: "Vecino creado",
        description: "El nuevo vecino ha sido registrado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el vecino.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditUserFormData }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Vecino actualizado",
        description: "Los datos del vecino han sido actualizados.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el vecino.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}/password`, { password });
      return response.json();
    },
    onSuccess: () => {
      setPasswordUser(null);
      passwordForm.reset();
      setShowNewPassword(false);
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña ha sido cambiada correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña.",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/users/${id}/deactivate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeactivateUser(null);
      toast({
        title: "Vecino desactivado",
        description: "El vecino ha sido desactivado y no podrá acceder al sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo desactivar el vecino.",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/users/${id}/reactivate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setReactivateUser(null);
      toast({
        title: "Vecino reactivado",
        description: "El vecino ha sido reactivado y puede acceder al sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo reactivar el vecino.",
        variant: "destructive",
      });
    },
  });

  const getCommunityName = (communityId: string | null) => {
    if (!communityId || !communities) return "Sin comunidad";
    const community = communities.find(c => c.id === communityId);
    return community?.name || "Desconocida";
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      presidente: { label: "Presidente", variant: "default" },
      vecino: { label: "Vecino", variant: "secondary" },
    };
    const roleInfo = roleLabels[role] || { label: role, variant: "outline" };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = search === "" || 
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.unitNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCommunity = selectedCommunity === "all" || user.communityId === selectedCommunity;
    
    return matchesSearch && matchesCommunity;
  });

  const onAddSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: EditUserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    }
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    if (passwordUser) {
      updatePasswordMutation.mutate({ id: passwordUser.id, password: data.password });
    }
  };

  if (usersLoading || communitiesLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="page-vecinos-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-vecinos">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Gestión de Vecinos</h1>
          <p className="text-muted-foreground mt-1">
            Administra los residentes de tus comunidades
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-vecino">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Vecino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Vecino</DialogTitle>
              <DialogDescription>
                Registra un nuevo residente en una de tus comunidades
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="communityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comunidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-add-community">
                            <SelectValue placeholder="Selecciona una comunidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {communities?.map(community => (
                            <SelectItem key={community.id} value={community.id} data-testid={`option-community-${community.id}`}>
                              {community.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Juan García López" data-testid="input-add-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="juan@email.com" data-testid="input-add-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+34 600..." data-testid="input-add-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad / Piso</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1A" data-testid="input-add-unit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={addForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vecino">Vecino</SelectItem>
                          <SelectItem value="presidente">Presidente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Credenciales de acceso</p>
                  
                  <FormField
                    control={addForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="juangarcia" data-testid="input-add-username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              type={showPassword ? "text" : "password"}
                              placeholder="Contraseña segura" 
                              data-testid="input-add-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-add">
                    {createUserMutation.isPending ? "Creando..." : "Crear Vecino"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Vecinos
          </CardTitle>
          <CardDescription>
            {filteredUsers?.length || 0} vecinos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o unidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-community">
                <SelectValue placeholder="Filtrar por comunidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunidades</SelectItem>
                {communities?.map(community => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Comunidad</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron vecinos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map(user => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.fullName || user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.unitNumber || "-"}</TableCell>
                      <TableCell>{getCommunityName(user.communityId)}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser(user as User)}
                            title="Editar"
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPasswordUser(user as User)}
                            title="Cambiar contraseña"
                            data-testid={`button-password-${user.id}`}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          {user.active ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeactivateUser(user as User)}
                              title="Desactivar"
                              data-testid={`button-deactivate-${user.id}`}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setReactivateUser(user as User)}
                              title="Reactivar"
                              data-testid={`button-reactivate-${user.id}`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Vecino</DialogTitle>
            <DialogDescription>
              Actualiza los datos del residente
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-fullname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad / Piso</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vecino">Vecino</SelectItem>
                        <SelectItem value="presidente">Presidente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={updateUserMutation.isPending} data-testid="button-submit-edit">
                  {updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordUser} onOpenChange={(open) => { 
        if (!open) {
          setPasswordUser(null);
          passwordForm.reset();
          setShowNewPassword(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {passwordUser?.fullName || passwordUser?.username}
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Nueva contraseña" 
                          data-testid="input-new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Repetir contraseña" 
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={updatePasswordMutation.isPending} data-testid="button-submit-password">
                  {updatePasswordMutation.isPending ? "Guardando..." : "Cambiar Contraseña"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deactivateUser} onOpenChange={(open) => !open && setDeactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Vecino</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas desactivar a {deactivateUser?.fullName || deactivateUser?.username}? 
              No podrá acceder al sistema hasta que lo reactives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-deactivate">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateUser && deactivateMutation.mutate(deactivateUser.id)}
              data-testid="button-confirm-deactivate"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reactivateUser} onOpenChange={(open) => !open && setReactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivar Vecino</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas reactivar a {reactivateUser?.fullName || reactivateUser?.username}? 
              Podrá volver a acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reactivate">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reactivateUser && reactivateMutation.mutate(reactivateUser.id)}
              data-testid="button-confirm-reactivate"
            >
              Reactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
