import { db } from "./db";
import { 
  type User, 
  type InsertUser,
  type Tenant,
  type InsertTenant,
  type Incident,
  type InsertIncident,
  type Document,
  type InsertDocument,
  type Agreement,
  type InsertAgreement,
  type Derrama,
  type InsertDerrama,
  type DerramaPayment,
  type InsertDerramaPayment,
  type Provider,
  type InsertProvider,
  users,
  tenants,
  incidents,
  documents,
  agreements,
  derramas,
  derramaPayments,
  providers
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string, tenantId: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  getIncidents(tenantId: string): Promise<Incident[]>;
  getIncident(id: string, tenantId: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, tenantId: string, incident: Partial<InsertIncident>): Promise<Incident | undefined>;
  deleteIncident(id: string, tenantId: string): Promise<boolean>;
  
  getDocuments(tenantId: string): Promise<Document[]>;
  getDocument(id: string, tenantId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, tenantId: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string, tenantId: string): Promise<boolean>;
  
  getAgreements(tenantId: string): Promise<Agreement[]>;
  getAgreementsByDocument(documentId: string, tenantId: string): Promise<Agreement[]>;
  createAgreement(agreement: InsertAgreement): Promise<Agreement>;
  updateAgreement(id: string, tenantId: string, updates: Partial<InsertAgreement>): Promise<Agreement | undefined>;
  deleteAgreement(id: string, tenantId: string): Promise<boolean>;
  
  getDerramas(tenantId: string): Promise<Derrama[]>;
  getDerrama(id: string, tenantId: string): Promise<Derrama | undefined>;
  createDerrama(derrama: InsertDerrama): Promise<Derrama>;
  updateDerrama(id: string, tenantId: string, updates: Partial<InsertDerrama>): Promise<Derrama | undefined>;
  deleteDerrama(id: string, tenantId: string): Promise<boolean>;
  
  getDerramaPayments(derramaId: string): Promise<DerramaPayment[]>;
  createDerramaPayment(payment: InsertDerramaPayment): Promise<DerramaPayment>;
  updateDerramaPayment(id: string, updates: Partial<InsertDerramaPayment>): Promise<DerramaPayment | undefined>;
  
  getProviders(tenantId: string): Promise<Provider[]>;
  getProvider(id: string, tenantId: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, tenantId: string, updates: Partial<InsertProvider>): Promise<Provider | undefined>;
  deleteProvider(id: string, tenantId: string): Promise<boolean>;
  
  getDashboardStats(tenantId: string): Promise<{
    totalIncidents: number;
    activeIncidents: number;
    totalDocuments: number;
    activeDerramas: number;
  }>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string, tenantId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(eq(users.username, username), eq(users.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.domain, domain)).limit(1);
    return result[0];
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(tenant).returning();
    return result[0];
  }

  async getIncidents(tenantId: string): Promise<Incident[]> {
    return db.select().from(incidents)
      .where(eq(incidents.tenantId, tenantId))
      .orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: string, tenantId: string): Promise<Incident | undefined> {
    const result = await db.select().from(incidents)
      .where(and(eq(incidents.id, id), eq(incidents.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const result = await db.insert(incidents).values(incident).returning();
    return result[0];
  }

  async updateIncident(id: string, tenantId: string, updates: Partial<InsertIncident>): Promise<Incident | undefined> {
    const result = await db.update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(incidents.id, id), eq(incidents.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteIncident(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(incidents)
      .where(and(eq(incidents.id, id), eq(incidents.tenantId, tenantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDocuments(tenantId: string): Promise<Document[]> {
    return db.select().from(documents)
      .where(eq(documents.tenantId, tenantId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string, tenantId: string): Promise<Document | undefined> {
    const result = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async updateDocument(id: string, tenantId: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents)
      .set(updates)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAgreements(tenantId: string): Promise<Agreement[]> {
    return db.select().from(agreements)
      .where(eq(agreements.tenantId, tenantId))
      .orderBy(desc(agreements.createdAt));
  }

  async getAgreementsByDocument(documentId: string, tenantId: string): Promise<Agreement[]> {
    return db.select().from(agreements)
      .where(and(eq(agreements.documentId, documentId), eq(agreements.tenantId, tenantId)))
      .orderBy(desc(agreements.createdAt));
  }

  async createAgreement(agreement: InsertAgreement): Promise<Agreement> {
    const result = await db.insert(agreements).values(agreement).returning();
    return result[0];
  }

  async updateAgreement(id: string, tenantId: string, updates: Partial<InsertAgreement>): Promise<Agreement | undefined> {
    const result = await db.update(agreements)
      .set(updates)
      .where(and(eq(agreements.id, id), eq(agreements.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteAgreement(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(agreements)
      .where(and(eq(agreements.id, id), eq(agreements.tenantId, tenantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDerramas(tenantId: string): Promise<Derrama[]> {
    return db.select().from(derramas)
      .where(eq(derramas.tenantId, tenantId))
      .orderBy(desc(derramas.createdAt));
  }

  async getDerrama(id: string, tenantId: string): Promise<Derrama | undefined> {
    const result = await db.select().from(derramas)
      .where(and(eq(derramas.id, id), eq(derramas.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async createDerrama(derrama: InsertDerrama): Promise<Derrama> {
    const result = await db.insert(derramas).values(derrama).returning();
    return result[0];
  }

  async updateDerrama(id: string, tenantId: string, updates: Partial<InsertDerrama>): Promise<Derrama | undefined> {
    const result = await db.update(derramas)
      .set(updates)
      .where(and(eq(derramas.id, id), eq(derramas.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteDerrama(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(derramas)
      .where(and(eq(derramas.id, id), eq(derramas.tenantId, tenantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDerramaPayments(derramaId: string): Promise<DerramaPayment[]> {
    return db.select().from(derramaPayments)
      .where(eq(derramaPayments.derramaId, derramaId))
      .orderBy(desc(derramaPayments.createdAt));
  }

  async createDerramaPayment(payment: InsertDerramaPayment): Promise<DerramaPayment> {
    const result = await db.insert(derramaPayments).values(payment).returning();
    return result[0];
  }

  async updateDerramaPayment(id: string, updates: Partial<InsertDerramaPayment>): Promise<DerramaPayment | undefined> {
    const result = await db.update(derramaPayments)
      .set(updates)
      .where(eq(derramaPayments.id, id))
      .returning();
    return result[0];
  }

  async getProviders(tenantId: string): Promise<Provider[]> {
    return db.select().from(providers)
      .where(eq(providers.tenantId, tenantId))
      .orderBy(desc(providers.createdAt));
  }

  async getProvider(id: string, tenantId: string): Promise<Provider | undefined> {
    const result = await db.select().from(providers)
      .where(and(eq(providers.id, id), eq(providers.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const result = await db.insert(providers).values(provider).returning();
    return result[0];
  }

  async updateProvider(id: string, tenantId: string, updates: Partial<InsertProvider>): Promise<Provider | undefined> {
    const result = await db.update(providers)
      .set(updates)
      .where(and(eq(providers.id, id), eq(providers.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteProvider(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(providers)
      .where(and(eq(providers.id, id), eq(providers.tenantId, tenantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDashboardStats(tenantId: string): Promise<{
    totalIncidents: number;
    activeIncidents: number;
    totalDocuments: number;
    activeDerramas: number;
  }> {
    const [incidentsCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(incidents)
      .where(eq(incidents.tenantId, tenantId));
    
    const [activeIncidentsCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(incidents)
      .where(and(
        eq(incidents.tenantId, tenantId),
        sql`${incidents.status} != 'resuelto'`
      ));
    
    const [documentsCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(eq(documents.tenantId, tenantId));
    
    const [derramasCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(derramas)
      .where(and(
        eq(derramas.tenantId, tenantId),
        sql`${derramas.dueDate} >= CURRENT_DATE`
      ));

    return {
      totalIncidents: incidentsCount?.count || 0,
      activeIncidents: activeIncidentsCount?.count || 0,
      totalDocuments: documentsCount?.count || 0,
      activeDerramas: derramasCount?.count || 0,
    };
  }
}

export const storage = new DbStorage();
