import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Updated role enum for 4-tier hierarchy (with superadmin as highest level)
export const roleEnum = pgEnum("role", ["superadmin", "admin_fincas", "presidente", "vecino"]);
export const incidentStatusEnum = pgEnum("incident_status", ["pendiente", "en_curso", "resuelto"]);
export const incidentPriorityEnum = pgEnum("incident_priority", ["alta", "media", "baja"]);
export const agreementStatusEnum = pgEnum("agreement_status", ["pendiente", "aprobado", "rechazado"]);

// Tier 1: Property Management Companies (Administradores de Fincas)
export const propertyCompanies = pgTable("property_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#8b5cf6"),
  accentColor: text("accent_color").default("#fb923c"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyCompanySchema = createInsertSchema(propertyCompanies).omit({
  id: true,
  createdAt: true,
});
export type InsertPropertyCompany = z.infer<typeof insertPropertyCompanySchema>;
export type PropertyCompany = typeof propertyCompanies.$inferSelect;

// Tier 2: Communities (Comunidades de vecinos)
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyCompanyId: varchar("property_company_id").notNull().references(() => propertyCompanies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  postalCode: text("postal_code"),
  city: text("city").notNull(),
  province: text("province"),
  totalUnits: integer("total_units").notNull(), // Total number of units/apartments
  presidentId: varchar("president_id"), // Will be linked to users later
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
});
export const updateCommunitySchema = insertCommunitySchema.partial().omit({
  propertyCompanyId: true,
});
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type UpdateCommunity = z.infer<typeof updateCommunitySchema>;
export type Community = typeof communities.$inferSelect;

// Tier 3: Users (Vecinos, Presidentes, and Property Company Admins)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").references(() => communities.id, { onDelete: "cascade" }), // Null for admin_fincas and superadmin users
  propertyCompanyId: varchar("property_company_id").references(() => propertyCompanies.id, { onDelete: "cascade" }), // For admin_fincas users, null for superadmin
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("vecino"),
  fullName: text("full_name"),
  unitNumber: text("unit_number"), // Apartment/unit number for residents
  active: boolean("active").notNull().default(true), // For soft-delete/disable users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  active: true, // Active is managed separately
});
export const updateUserSchema = insertUserSchema.partial().omit({
  communityId: true,
  propertyCompanyId: true,
  password: true, // Password changes require separate secure endpoint
});
// Superadmin-specific schema for managing admin users
export const superAdminUpdateUserSchema = updateUserSchema.extend({
  propertyCompanyId: z.string().nullable().optional(), // Superadmin can change company assignment
  active: z.boolean().optional(), // Superadmin can enable/disable users
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type SuperAdminUpdateUser = z.infer<typeof superAdminUpdateUserSchema>;
export type User = typeof users.$inferSelect;

// Domain entities now belong to communities
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: incidentStatusEnum("status").notNull().default("pendiente"),
  priority: incidentPriorityEnum("priority").notNull().default("media"),
  category: text("category").notNull(),
  location: text("location"),
  reportedBy: varchar("reported_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateIncidentSchema = insertIncidentSchema.partial().omit({
  communityId: true,
});
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type UpdateIncident = z.infer<typeof updateIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  isAnalyzed: boolean("is_analyzed").default(false),
  analysisResult: text("analysis_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});
export const updateDocumentSchema = insertDocumentSchema.partial().omit({
  communityId: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const agreements = pgTable("agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  documentId: varchar("document_id").references(() => documents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  responsible: text("responsible"),
  deadline: timestamp("deadline"),
  status: agreementStatusEnum("status").notNull().default("pendiente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgreementSchema = createInsertSchema(agreements).omit({
  id: true,
  createdAt: true,
});
export const updateAgreementSchema = insertAgreementSchema.partial().omit({
  communityId: true,
});
export type InsertAgreement = z.infer<typeof insertAgreementSchema>;
export type UpdateAgreement = z.infer<typeof updateAgreementSchema>;
export type Agreement = typeof agreements.$inferSelect;

export const derramas = pgTable("derramas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  collectedAmount: decimal("collected_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDerramaSchema = createInsertSchema(derramas, {
  dueDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});
export const updateDerramaSchema = insertDerramaSchema.partial().omit({
  communityId: true,
});
export type InsertDerrama = z.infer<typeof insertDerramaSchema>;
export type UpdateDerrama = z.infer<typeof updateDerramaSchema>;
export type Derrama = typeof derramas.$inferSelect;

export const derramaPayments = pgTable("derrama_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  derramaId: varchar("derrama_id").notNull().references(() => derramas.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDerramaPaymentSchema = createInsertSchema(derramaPayments).omit({
  id: true,
  createdAt: true,
});
export const updateDerramaPaymentSchema = insertDerramaPaymentSchema.partial().omit({
  derramaId: true,
  userId: true,
});
export type InsertDerramaPayment = z.infer<typeof insertDerramaPaymentSchema>;
export type UpdateDerramaPayment = z.infer<typeof updateDerramaPaymentSchema>;
export type DerramaPayment = typeof derramaPayments.$inferSelect;

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  servicesCount: integer("services_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
});
export const updateProviderSchema = insertProviderSchema.partial().omit({
  communityId: true,
});
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type UpdateProvider = z.infer<typeof updateProviderSchema>;
export type Provider = typeof providers.$inferSelect;

// Quota system enums
export const quotaFrequencyEnum = pgEnum("quota_frequency", ["mensual", "trimestral", "semestral", "anual", "unica"]);
export const quotaPaymentStatusEnum = pgEnum("quota_payment_status", ["pendiente", "pagada", "vencida"]);

// Meeting enums
export const meetingTypeEnum = pgEnum("meeting_type", ["ordinaria", "extraordinaria"]);
export const meetingStatusEnum = pgEnum("meeting_status", ["convocada", "celebrada", "cancelada"]);
export const attendanceTypeEnum = pgEnum("attendance_type", ["asistente", "representado", "ausente"]);

// Quota Types - Define types of quotas for a community (up to 10)
export const quotaTypes = pgTable("quota_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Cuota ordinaria", "Cuota extraordinaria", "Gastos agua"
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: quotaFrequencyEnum("frequency").notNull().default("mensual"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotaTypeSchema = createInsertSchema(quotaTypes).omit({
  id: true,
  createdAt: true,
});
export const updateQuotaTypeSchema = insertQuotaTypeSchema.partial().omit({
  communityId: true,
});
export type InsertQuotaType = z.infer<typeof insertQuotaTypeSchema>;
export type UpdateQuotaType = z.infer<typeof updateQuotaTypeSchema>;
export type QuotaType = typeof quotaTypes.$inferSelect;

// Quota Assignments - Assign quotas to specific residents with payment tracking
export const quotaAssignments = pgTable("quota_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  quotaTypeId: varchar("quota_type_id").notNull().references(() => quotaTypes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Vecino
  status: quotaPaymentStatusEnum("status").notNull().default("pendiente"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Can differ from quota type if adjusted
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  notes: text("notes"), // Optional notes (e.g., payment method, discount reason)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotaAssignmentSchema = createInsertSchema(quotaAssignments).omit({
  id: true,
  createdAt: true,
});
export const updateQuotaAssignmentSchema = insertQuotaAssignmentSchema.partial().omit({
  communityId: true,
  quotaTypeId: true,
  userId: true,
});
export type InsertQuotaAssignment = z.infer<typeof insertQuotaAssignmentSchema>;
export type UpdateQuotaAssignment = z.infer<typeof updateQuotaAssignmentSchema>;
export type QuotaAssignment = typeof quotaAssignments.$inferSelect;

// Meetings (Juntas)
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  type: meetingTypeEnum("type").notNull().default("ordinaria"),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  location: text("location").notNull(),
  status: meetingStatusEnum("status").notNull().default("convocada"),
  minutesContent: text("minutes_content"), // Acta content
  minutesApproved: boolean("minutes_approved").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMeetingSchema = createInsertSchema(meetings, {
  scheduledDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMeetingSchema = insertMeetingSchema.partial().omit({
  communityId: true,
});
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type UpdateMeeting = z.infer<typeof updateMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// Meeting Agenda Items (Puntos del orden del día)
export const meetingAgendaItems = pgTable("meeting_agenda_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetingAgendaItemSchema = createInsertSchema(meetingAgendaItems).omit({
  id: true,
  createdAt: true,
});
export const updateMeetingAgendaItemSchema = insertMeetingAgendaItemSchema.partial().omit({
  meetingId: true,
});
export type InsertMeetingAgendaItem = z.infer<typeof insertMeetingAgendaItemSchema>;
export type UpdateMeetingAgendaItem = z.infer<typeof updateMeetingAgendaItemSchema>;
export type MeetingAgendaItem = typeof meetingAgendaItems.$inferSelect;

// Meeting Attendances (Registro de asistentes)
export const meetingAttendances = pgTable("meeting_attendances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attendanceType: attendanceTypeEnum("attendance_type").notNull().default("ausente"),
  representedBy: varchar("represented_by").references(() => users.id), // If representado, who represents them
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetingAttendanceSchema = createInsertSchema(meetingAttendances).omit({
  id: true,
  createdAt: true,
});
export const updateMeetingAttendanceSchema = insertMeetingAttendanceSchema.partial().omit({
  meetingId: true,
  userId: true,
});
export type InsertMeetingAttendance = z.infer<typeof insertMeetingAttendanceSchema>;
export type UpdateMeetingAttendance = z.infer<typeof updateMeetingAttendanceSchema>;
export type MeetingAttendance = typeof meetingAttendances.$inferSelect;
