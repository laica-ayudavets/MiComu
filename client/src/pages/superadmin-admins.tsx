import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Plus, Pencil, Search, Ban, CheckCircle, Key, Eye, EyeOff } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createAdminWithPasswordSchema } from "@shared/schema";

interface PropertyCompany {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  propertyCompanyId: string | null;
  active: boolean;
  createdAt: string;
}

// Derive frontend form schema from shared schema (omit role as it's fixed to admin_fincas)
// Override propertyCompanyId to provide better validation error messages
const adminFormSchema = createAdminWithPasswordSchema.omit({ role: true }).extend({
  propertyCompanyId: z.string()
    .min(1, "Property company is required")
    .uuid("Invalid property company selection"),
});

const editAdminSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  propertyCompanyId: z.string().optional(),
  active: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminFormData = z.infer<typeof adminFormSchema>;
type EditAdminFormData = z.infer<typeof editAdminSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SuperadminAdmins() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: admins = [], isLoading: adminsLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/superadmin/admins"],
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<PropertyCompany[]>({
    queryKey: ["/api/superadmin/property-companies"],
  });

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      propertyCompanyId: undefined,
    },
  });

  const editForm = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {},
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdminFormData) => {
      return apiRequest("POST", "/api/superadmin/admins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      toast({
        title: "Admin created",
        description: "Administrator account has been created successfully",
      });
      setDialogOpen(false);
      setShowPassword(false);
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
    mutationFn: async ({ id, data }: { id: string; data: EditAdminFormData }) => {
      return apiRequest("PATCH", `/api/superadmin/admins/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      toast({
        title: "Admin updated",
        description: "Administrator account has been updated successfully",
      });
      setDialogOpen(false);
      setShowPassword(false);
      setEditingAdmin(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return apiRequest("POST", `/api/superadmin/admins/${id}/change-password`, { newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Administrator password has been changed successfully",
      });
      setPasswordDialogOpen(false);
      setSelectedAdmin(null);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AdminFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: EditAdminFormData) => {
    if (editingAdmin) {
      updateMutation.mutate({ id: editingAdmin.id, data });
    }
  };

  const handlePasswordSubmit = (data: ChangePasswordFormData) => {
    if (selectedAdmin) {
      changePasswordMutation.mutate({
        id: selectedAdmin.id,
        newPassword: data.newPassword,
      });
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    editForm.reset({
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      propertyCompanyId: admin.propertyCompanyId || "",
      active: admin.active,
    });
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingAdmin(null);
    form.reset(); // Use default values which set propertyCompanyId to undefined
    setDialogOpen(true);
  };

  const handleChangePassword = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    passwordForm.reset({ newPassword: "" });
    setPasswordDialogOpen(true);
  };

  const handleToggleActive = (admin: AdminUser) => {
    updateMutation.mutate({
      id: admin.id,
      data: { active: !admin.active },
    });
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.username.toLowerCase().includes(search.toLowerCase()) ||
    admin.email.toLowerCase().includes(search.toLowerCase()) ||
    admin.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return "—";
    const company = companies.find((c) => c.id === companyId);
    return company?.name || "Unknown";
  };

  const isLoading = adminsLoading || companiesLoading;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] min-h-full" data-testid="page-superadmin-admins">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administrator Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Manage admin_fincas user accounts and their access
          </p>
        </div>
        {companies.length === 0 ? (
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-2">Create a property company first</p>
            <Button variant="outline" disabled data-testid="button-create-admin-disabled">
              <Plus className="w-4 h-4 mr-2" />
              New Admin
            </Button>
          </div>
        ) : (
          <Button onClick={handleCreateNew} data-testid="button-create-admin">
            <Plus className="w-4 h-4 mr-2" />
            New Admin
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Administrators List</CardTitle>
          <CardDescription>Search and manage all admin_fincas accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-admins"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No administrators found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id} data-testid={`row-admin-${admin.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{admin.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{admin.username}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{admin.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getCompanyName(admin.propertyCompanyId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.active ? "default" : "secondary"} data-testid={`badge-status-${admin.id}`}>
                        {admin.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(admin)}
                        data-testid={`button-edit-${admin.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChangePassword(admin)}
                        data-testid={`button-password-${admin.id}`}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(admin)}
                        data-testid={`button-toggle-${admin.id}`}
                      >
                        {admin.active ? (
                          <Ban className="w-4 h-4 text-destructive" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
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
        <DialogContent data-testid="dialog-admin-form">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? "Edit Administrator" : "Create New Administrator"}
            </DialogTitle>
            <DialogDescription>
              {editingAdmin
                ? "Update the administrator account details"
                : "Create a new admin_fincas user account"}
            </DialogDescription>
          </DialogHeader>
          {editingAdmin ? (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-admin-username" />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-admin-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-admin-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="propertyCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Company</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company">
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      setEditingAdmin(null);
                      editForm.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-admin"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-admin-username" />
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-admin-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-admin-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showPassword ? "text" : "password"} 
                            data-testid="input-admin-password" 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minimum 8 characters with uppercase, lowercase, and number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="propertyCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Company *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value || undefined)} 
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-company">
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      setShowPassword(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-admin"
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent data-testid="dialog-change-password">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {selectedAdmin?.fullName}
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" data-testid="input-new-password" />
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
                    setPasswordDialogOpen(false);
                    setSelectedAdmin(null);
                    passwordForm.reset();
                  }}
                  data-testid="button-cancel-password"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-save-password"
                >
                  {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
