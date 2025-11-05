import { db } from "./db";
import { 
  type User, 
  type InsertUser,
  type PropertyCompany,
  type InsertPropertyCompany,
  type Community,
  type InsertCommunity,
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
  propertyCompanies,
  communities,
  incidents,
  documents,
  agreements,
  derramas,
  derramaPayments,
  providers
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property Company management
  getPropertyCompany(id: string): Promise<PropertyCompany | undefined>;
  getPropertyCompanyByDomain(domain: string): Promise<PropertyCompany | undefined>;
  createPropertyCompany(company: InsertPropertyCompany): Promise<PropertyCompany>;
  
  // Community management
  getCommunities(propertyCompanyId: string): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, propertyCompanyId: string, updates: Partial<InsertCommunity>): Promise<Community | undefined>;
  deleteCommunity(id: string, propertyCompanyId: string): Promise<boolean>;
  
  // Incident management (community-scoped)
  getIncidents(communityId: string): Promise<Incident[]>;
  getIncident(id: string, communityId: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, communityId: string, incident: Partial<InsertIncident>): Promise<Incident | undefined>;
  deleteIncident(id: string, communityId: string): Promise<boolean>;
  
  // Document management (community-scoped)
  getDocuments(communityId: string): Promise<Document[]>;
  getDocument(id: string, communityId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, communityId: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string, communityId: string): Promise<boolean>;
  
  // Agreement management (community-scoped)
  getAgreements(communityId: string): Promise<Agreement[]>;
  getAgreementsByDocument(documentId: string, communityId: string): Promise<Agreement[]>;
  createAgreement(agreement: InsertAgreement): Promise<Agreement>;
  updateAgreement(id: string, communityId: string, updates: Partial<InsertAgreement>): Promise<Agreement | undefined>;
  deleteAgreement(id: string, communityId: string): Promise<boolean>;
  
  // Derrama management (community-scoped)
  getDerramas(communityId: string): Promise<Derrama[]>;
  getDerrama(id: string, communityId: string): Promise<Derrama | undefined>;
  createDerrama(derrama: InsertDerrama): Promise<Derrama>;
  updateDerrama(id: string, communityId: string, updates: Partial<InsertDerrama>): Promise<Derrama | undefined>;
  deleteDerrama(id: string, communityId: string): Promise<boolean>;
  
  // Derrama Payment management
  getDerramaPayments(derramaId: string): Promise<DerramaPayment[]>;
  createDerramaPayment(payment: InsertDerramaPayment): Promise<DerramaPayment>;
  updateDerramaPayment(id: string, communityId: string, updates: Partial<InsertDerramaPayment>): Promise<DerramaPayment | undefined>;
  
  // Provider management (community-scoped)
  getProviders(communityId: string): Promise<Provider[]>;
  getProvider(id: string, communityId: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, communityId: string, updates: Partial<InsertProvider>): Promise<Provider | undefined>;
  deleteProvider(id: string, communityId: string): Promise<boolean>;
  
  // Dashboard stats (community-scoped)
  getDashboardStats(communityId: string): Promise<{
    totalIncidents: number;
    activeIncidents: number;
    totalDocuments: number;
    activeDerramas: number;
  }>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Property Company methods
  async getPropertyCompany(id: string): Promise<PropertyCompany | undefined> {
    const result = await db.select().from(propertyCompanies).where(eq(propertyCompanies.id, id)).limit(1);
    return result[0];
  }

  async getPropertyCompanyByDomain(domain: string): Promise<PropertyCompany | undefined> {
    const result = await db.select().from(propertyCompanies).where(eq(propertyCompanies.domain, domain)).limit(1);
    return result[0];
  }

  async createPropertyCompany(company: InsertPropertyCompany): Promise<PropertyCompany> {
    const result = await db.insert(propertyCompanies).values(company).returning();
    return result[0];
  }

  // Community methods
  async getCommunities(propertyCompanyId: string): Promise<Community[]> {
    return db.select().from(communities)
      .where(eq(communities.propertyCompanyId, propertyCompanyId))
      .orderBy(desc(communities.createdAt));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const result = await db.select().from(communities)
      .where(eq(communities.id, id))
      .limit(1);
    return result[0];
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const result = await db.insert(communities).values(community).returning();
    return result[0];
  }

  async updateCommunity(id: string, propertyCompanyId: string, updates: Partial<InsertCommunity>): Promise<Community | undefined> {
    const result = await db.update(communities)
      .set(updates)
      .where(and(eq(communities.id, id), eq(communities.propertyCompanyId, propertyCompanyId)))
      .returning();
    return result[0];
  }

  async deleteCommunity(id: string, propertyCompanyId: string): Promise<boolean> {
    const result = await db.delete(communities)
      .where(and(eq(communities.id, id), eq(communities.propertyCompanyId, propertyCompanyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Incident methods (now community-scoped)
  async getIncidents(communityId: string): Promise<Incident[]> {
    return db.select().from(incidents)
      .where(eq(incidents.communityId, communityId))
      .orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: string, communityId: string): Promise<Incident | undefined> {
    const result = await db.select().from(incidents)
      .where(and(eq(incidents.id, id), eq(incidents.communityId, communityId)))
      .limit(1);
    return result[0];
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const result = await db.insert(incidents).values(incident).returning();
    return result[0];
  }

  async updateIncident(id: string, communityId: string, updates: Partial<InsertIncident>): Promise<Incident | undefined> {
    const result = await db.update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(incidents.id, id), eq(incidents.communityId, communityId)))
      .returning();
    return result[0];
  }

  async deleteIncident(id: string, communityId: string): Promise<boolean> {
    const result = await db.delete(incidents)
      .where(and(eq(incidents.id, id), eq(incidents.communityId, communityId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Document methods (community-scoped)
  async getDocuments(communityId: string): Promise<Document[]> {
    return db.select().from(documents)
      .where(eq(documents.communityId, communityId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string, communityId: string): Promise<Document | undefined> {
    const result = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.communityId, communityId)))
      .limit(1);
    return result[0];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async updateDocument(id: string, communityId: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents)
      .set(updates)
      .where(and(eq(documents.id, id), eq(documents.communityId, communityId)))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string, communityId: string): Promise<boolean> {
    const result = await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.communityId, communityId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Agreement methods (community-scoped)
  async getAgreements(communityId: string): Promise<Agreement[]> {
    return db.select().from(agreements)
      .where(eq(agreements.communityId, communityId))
      .orderBy(desc(agreements.createdAt));
  }

  async getAgreementsByDocument(documentId: string, communityId: string): Promise<Agreement[]> {
    return db.select().from(agreements)
      .where(and(eq(agreements.documentId, documentId), eq(agreements.communityId, communityId)))
      .orderBy(desc(agreements.createdAt));
  }

  async createAgreement(agreement: InsertAgreement): Promise<Agreement> {
    const result = await db.insert(agreements).values(agreement).returning();
    return result[0];
  }

  async updateAgreement(id: string, communityId: string, updates: Partial<InsertAgreement>): Promise<Agreement | undefined> {
    const result = await db.update(agreements)
      .set(updates)
      .where(and(eq(agreements.id, id), eq(agreements.communityId, communityId)))
      .returning();
    return result[0];
  }

  async deleteAgreement(id: string, communityId: string): Promise<boolean> {
    const result = await db.delete(agreements)
      .where(and(eq(agreements.id, id), eq(agreements.communityId, communityId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Derrama methods (community-scoped)
  async getDerramas(communityId: string): Promise<Derrama[]> {
    return db.select().from(derramas)
      .where(eq(derramas.communityId, communityId))
      .orderBy(desc(derramas.createdAt));
  }

  async getDerrama(id: string, communityId: string): Promise<Derrama | undefined> {
    const result = await db.select().from(derramas)
      .where(and(eq(derramas.id, id), eq(derramas.communityId, communityId)))
      .limit(1);
    return result[0];
  }

  async createDerrama(derrama: InsertDerrama): Promise<Derrama> {
    const result = await db.insert(derramas).values(derrama).returning();
    return result[0];
  }

  async updateDerrama(id: string, communityId: string, updates: Partial<InsertDerrama>): Promise<Derrama | undefined> {
    const result = await db.update(derramas)
      .set(updates)
      .where(and(eq(derramas.id, id), eq(derramas.communityId, communityId)))
      .returning();
    return result[0];
  }

  async deleteDerrama(id: string, communityId: string): Promise<boolean> {
    const result = await db.delete(derramas)
      .where(and(eq(derramas.id, id), eq(derramas.communityId, communityId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Derrama Payment methods
  async getDerramaPayments(derramaId: string): Promise<DerramaPayment[]> {
    return db.select().from(derramaPayments)
      .where(eq(derramaPayments.derramaId, derramaId))
      .orderBy(desc(derramaPayments.createdAt));
  }

  async createDerramaPayment(payment: InsertDerramaPayment): Promise<DerramaPayment> {
    const result = await db.insert(derramaPayments).values(payment).returning();
    return result[0];
  }

  async updateDerramaPayment(id: string, communityId: string, updates: Partial<InsertDerramaPayment>): Promise<DerramaPayment | undefined> {
    const result = await db.update(derramaPayments)
      .set(updates)
      .where(
        and(
          eq(derramaPayments.id, id),
          eq(
            derramaPayments.derramaId,
            db.select({ id: derramas.id })
              .from(derramas)
              .where(and(
                eq(derramas.id, derramaPayments.derramaId),
                eq(derramas.communityId, communityId)
              ))
          )
        )
      )
      .returning();
    return result[0];
  }

  // Provider methods (community-scoped)
  async getProviders(communityId: string): Promise<Provider[]> {
    return db.select().from(providers)
      .where(eq(providers.communityId, communityId))
      .orderBy(desc(providers.createdAt));
  }

  async getProvider(id: string, communityId: string): Promise<Provider | undefined> {
    const result = await db.select().from(providers)
      .where(and(eq(providers.id, id), eq(providers.communityId, communityId)))
      .limit(1);
    return result[0];
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const result = await db.insert(providers).values(provider).returning();
    return result[0];
  }

  async updateProvider(id: string, communityId: string, updates: Partial<InsertProvider>): Promise<Provider | undefined> {
    const result = await db.update(providers)
      .set(updates)
      .where(and(eq(providers.id, id), eq(providers.communityId, communityId)))
      .returning();
    return result[0];
  }

  async deleteProvider(id: string, communityId: string): Promise<boolean> {
    const result = await db.delete(providers)
      .where(and(eq(providers.id, id), eq(providers.communityId, communityId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Dashboard stats (community-scoped)
  async getDashboardStats(communityId: string): Promise<{
    totalIncidents: number;
    activeIncidents: number;
    totalDocuments: number;
    activeDerramas: number;
  }> {
    const [incidentsCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(incidents)
      .where(eq(incidents.communityId, communityId));
    
    const [activeIncidentsCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(incidents)
      .where(and(
        eq(incidents.communityId, communityId),
        sql`${incidents.status} != 'resuelto'`
      ));
    
    const [documentsCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(eq(documents.communityId, communityId));
    
    const [derramasCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(derramas)
      .where(and(
        eq(derramas.communityId, communityId),
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
