import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  GripVertical,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  Meeting, 
  MeetingAgendaItem, 
  MeetingAttendance,
  InsertMeetingAgendaItem,
  InsertMeetingAttendance 
} from "@shared/schema";
import { 
  insertMeetingAgendaItemSchema,
  insertMeetingAttendanceSchema 
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUser } from "@/hooks/use-auth";

const agendaFormSchema = insertMeetingAgendaItemSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  orderIndex: z.number().int().min(0),
});

const attendanceFormSchema = insertMeetingAttendanceSchema.extend({
  userId: z.string().min(1, "Debe seleccionar un usuario"),
  attendanceType: z.enum(["asistente", "representado", "ausente"]),
});

type AgendaFormValues = z.infer<typeof agendaFormSchema>;
type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export default function JuntaDetail() {
  const [, params] = useRoute("/juntas/:id");
  const [_, setLocation] = useLocation();
  const meetingId = params?.id || "";
  const { toast } = useToast();
  const { data: user } = useUser();
  
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<MeetingAgendaItem | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<MeetingAttendance | null>(null);
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const [minutesContent, setMinutesContent] = useState("");

  // Fetch meeting details
  const { data: meeting, isLoading: isLoadingMeeting } = useQuery<Meeting>({
    queryKey: ["/api/meetings", meetingId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (!res.ok) throw new Error("Failed to fetch meeting");
      return res.json();
    },
    enabled: !!meetingId,
  });

  // Fetch agenda items
  const { data: agendaItems = [], isLoading: isLoadingAgenda } = useQuery<MeetingAgendaItem[]>({
    queryKey: ["/api/meetings", meetingId, "agenda-items"],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/agenda-items`);
      if (!res.ok) throw new Error("Failed to fetch agenda items");
      return res.json();
    },
    enabled: !!meetingId,
  });

  // Fetch attendances
  const { data: attendances = [], isLoading: isLoadingAttendances } = useQuery<MeetingAttendance[]>({
    queryKey: ["/api/meetings", meetingId, "attendances"],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/attendances`);
      if (!res.ok) throw new Error("Failed to fetch attendances");
      return res.json();
    },
    enabled: !!meetingId,
  });

  // Fetch community users for attendance management
  const { data: communityUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!meeting,
  });

  // Initialize minutes content when meeting loads
  useEffect(() => {
    if (meeting?.minutesContent) {
      setMinutesContent(meeting.minutesContent);
    }
  }, [meeting?.minutesContent]);

  // Agenda item form
  const agendaForm = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      meetingId,
      title: "",
      description: "",
      orderIndex: agendaItems.length,
    },
  });

  // Attendance form
  const attendanceForm = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      meetingId,
      userId: "",
      attendanceType: "asistente",
      representedBy: null,
    },
  });

  // Create agenda item mutation
  const createAgendaMutation = useMutation({
    mutationFn: async (data: AgendaFormValues) => {
      const res = await apiRequest("POST", `/api/meetings/${meetingId}/agenda-items`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "agenda-items"] });
      toast({ title: "Punto añadido", description: "El punto del orden del día se ha creado" });
      setAgendaDialogOpen(false);
      agendaForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update agenda item mutation
  const updateAgendaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AgendaFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/meetings/${meetingId}/agenda-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "agenda-items"] });
      toast({ title: "Punto actualizado", description: "El punto se ha actualizado correctamente" });
      setAgendaDialogOpen(false);
      setEditingAgenda(null);
      agendaForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete agenda item mutation
  const deleteAgendaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meetings/${meetingId}/agenda-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "agenda-items"] });
      toast({ title: "Punto eliminado", description: "El punto se ha eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create attendance mutation
  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceFormValues) => {
      const res = await apiRequest("POST", `/api/meetings/${meetingId}/attendances`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "attendances"] });
      toast({ title: "Asistencia registrada", description: "La asistencia se ha registrado correctamente" });
      setAttendanceDialogOpen(false);
      attendanceForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AttendanceFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/meetings/${meetingId}/attendances/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "attendances"] });
      toast({ title: "Asistencia actualizada", description: "La asistencia se ha actualizado correctamente" });
      setAttendanceDialogOpen(false);
      setEditingAttendance(null);
      attendanceForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete attendance mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meetings/${meetingId}/attendances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "attendances"] });
      toast({ title: "Asistencia eliminada", description: "La asistencia se ha eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update meeting minutes mutation
  const updateMinutesMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("PATCH", `/api/meetings/${meetingId}`, {
        minutesContent: content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId] });
      toast({ title: "Acta guardada", description: "El acta se ha guardado correctamente" });
      setIsEditingMinutes(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitAgenda = (data: AgendaFormValues) => {
    if (editingAgenda) {
      updateAgendaMutation.mutate({ id: editingAgenda.id, data });
    } else {
      createAgendaMutation.mutate(data);
    }
  };

  const onSubmitAttendance = (data: AttendanceFormValues) => {
    if (editingAttendance) {
      updateAttendanceMutation.mutate({ id: editingAttendance.id, data });
    } else {
      createAttendanceMutation.mutate(data);
    }
  };

  const handleEditAgenda = (item: MeetingAgendaItem) => {
    setEditingAgenda(item);
    agendaForm.reset({
      meetingId,
      title: item.title,
      description: item.description || "",
      orderIndex: item.orderIndex,
    });
    setAgendaDialogOpen(true);
  };

  const handleEditAttendance = (attendance: MeetingAttendance) => {
    setEditingAttendance(attendance);
    attendanceForm.reset({
      meetingId,
      userId: attendance.userId,
      attendanceType: attendance.attendanceType,
      representedBy: attendance.representedBy,
    });
    setAttendanceDialogOpen(true);
  };

  const handleSaveMinutes = () => {
    updateMinutesMutation.mutate(minutesContent);
  };

  if (isLoadingMeeting) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Junta no encontrada</p>
        <Button onClick={() => setLocation("/juntas")} className="mt-4">
          Volver a Juntas
        </Button>
      </div>
    );
  }

  const meetingTypeLabel = meeting.type === "ordinaria" ? "Ordinaria" : "Extraordinaria";
  const statusLabel = {
    convocada: "Convocada",
    celebrada: "Celebrada",
    cancelada: "Cancelada",
  }[meeting.status];

  const statusVariant = {
    convocada: "default" as const,
    celebrada: "default" as const,
    cancelada: "destructive" as const,
  }[meeting.status];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/juntas")}
          data-testid="button-back-to-meetings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-meeting-title">{meeting.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusVariant} data-testid="badge-meeting-status">{statusLabel}</Badge>
            <Badge variant="outline" data-testid="badge-meeting-type">{meetingTypeLabel}</Badge>
            <span className="text-sm text-muted-foreground" data-testid="text-meeting-date">
              {format(new Date(meeting.scheduledDate), "PPP 'a las' HH:mm", { locale: es })}
            </span>
          </div>
        </div>
      </div>

      {/* Meeting Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Junta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Lugar</p>
            <p className="text-sm text-muted-foreground" data-testid="text-meeting-location">
              {meeting.location}
            </p>
          </div>
          {meeting.description && (
            <div>
              <p className="text-sm font-medium">Descripción</p>
              <p className="text-sm text-muted-foreground" data-testid="text-meeting-description">
                {meeting.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Orden del Día</CardTitle>
          <Dialog open={agendaDialogOpen} onOpenChange={setAgendaDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingAgenda(null);
                  agendaForm.reset({
                    meetingId,
                    title: "",
                    description: "",
                    orderIndex: agendaItems.length,
                  });
                }}
                data-testid="button-add-agenda-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Punto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAgenda ? "Editar Punto" : "Añadir Punto del Orden del Día"}
                </DialogTitle>
                <DialogDescription>
                  {editingAgenda 
                    ? "Modifica los detalles del punto del orden del día" 
                    : "Añade un nuevo punto al orden del día de la junta"}
                </DialogDescription>
              </DialogHeader>
              <Form {...agendaForm}>
                <form onSubmit={agendaForm.handleSubmit(onSubmitAgenda)} className="space-y-4">
                  <FormField
                    control={agendaForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Aprobación de cuentas" {...field} data-testid="input-agenda-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={agendaForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detalles del punto a tratar..." 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-agenda-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createAgendaMutation.isPending || updateAgendaMutation.isPending}
                      data-testid="button-submit-agenda"
                    >
                      {editingAgenda ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingAgenda ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : agendaItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-agenda-items">
              No hay puntos en el orden del día
            </p>
          ) : (
            <div className="space-y-2">
              {agendaItems
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover-elevate"
                    data-testid={`agenda-item-${item.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-agenda-title-${item.id}`}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAgenda(item)}
                        data-testid={`button-edit-agenda-${item.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAgendaMutation.mutate(item.id)}
                        data-testid={`button-delete-agenda-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendances */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Asistencia</CardTitle>
          <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                onClick={() => {
                  setEditingAttendance(null);
                  attendanceForm.reset({
                    meetingId,
                    userId: "",
                    attendanceType: "asistente",
                    representedBy: null,
                  });
                }}
                data-testid="button-add-attendance"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Asistencia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAttendance ? "Editar Asistencia" : "Registrar Asistencia"}
                </DialogTitle>
                <DialogDescription>
                  {editingAttendance 
                    ? "Modifica el registro de asistencia" 
                    : "Registra la asistencia de un vecino a la junta"}
                </DialogDescription>
              </DialogHeader>
              <Form {...attendanceForm}>
                <form onSubmit={attendanceForm.handleSubmit(onSubmitAttendance)} className="space-y-4">
                  <FormField
                    control={attendanceForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuario *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-attendance-user">
                              <SelectValue placeholder="Seleccionar usuario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {communityUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={attendanceForm.control}
                    name="attendanceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Asistencia *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-attendance-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asistente">Asistente</SelectItem>
                            <SelectItem value="representado">Representado</SelectItem>
                            <SelectItem value="ausente">Ausente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={attendanceForm.control}
                    name="representedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Representado por (opcional)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-represented-by">
                              <SelectValue placeholder="Ninguno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Ninguno</SelectItem>
                            {communityUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
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
                      type="submit" 
                      disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                      data-testid="button-submit-attendance"
                    >
                      {editingAttendance ? "Actualizar" : "Registrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingAttendances ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : attendances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-attendances">
              No hay registros de asistencia
            </p>
          ) : (
            <div className="space-y-2">
              {attendances.map((attendance) => {
                const attendanceUser = communityUsers.find(u => u.id === attendance.userId);
                const representedByUser = attendance.representedBy 
                  ? communityUsers.find(u => u.id === attendance.representedBy)
                  : null;

                const icon = {
                  asistente: <UserCheck className="h-4 w-4 text-green-500" />,
                  representado: <Users className="h-4 w-4 text-blue-500" />,
                  ausente: <UserX className="h-4 w-4 text-red-500" />,
                }[attendance.attendanceType];

                const typeLabel = {
                  asistente: "Asistente",
                  representado: "Representado",
                  ausente: "Ausente",
                }[attendance.attendanceType];

                return (
                  <div
                    key={attendance.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover-elevate"
                    data-testid={`attendance-${attendance.id}`}
                  >
                    {icon}
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-attendance-user-${attendance.id}`}>
                        {attendanceUser?.name || "Usuario desconocido"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {typeLabel}
                        {representedByUser && ` por ${representedByUser.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAttendance(attendance)}
                        data-testid={`button-edit-attendance-${attendance.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAttendanceMutation.mutate(attendance.id)}
                        data-testid={`button-delete-attendance-${attendance.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Minutes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Acta de la Junta</CardTitle>
          {!isEditingMinutes ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setMinutesContent(meeting.minutesContent || "");
                setIsEditingMinutes(true);
              }}
              data-testid="button-edit-minutes"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMinutesContent(meeting.minutesContent || "");
                  setIsEditingMinutes(false);
                }}
                data-testid="button-cancel-minutes"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMinutes}
                disabled={updateMinutesMutation.isPending}
                data-testid="button-save-minutes"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditingMinutes ? (
            <Textarea
              value={minutesContent}
              onChange={(e) => setMinutesContent(e.target.value)}
              placeholder="Escribir el acta de la junta..."
              className="min-h-[300px]"
              data-testid="textarea-minutes"
            />
          ) : (
            <div className="min-h-[200px]">
              {meeting.minutesContent ? (
                <p className="whitespace-pre-wrap text-sm" data-testid="text-minutes-content">
                  {meeting.minutesContent}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No hay acta registrada
                </p>
              )}
            </div>
          )}
          {meeting.minutesApproved && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✓ Acta aprobada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
