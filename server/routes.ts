import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { db } from "./db";
import { 
  hashPassword,
  verifyPassword,
  getUserContext,
  getCommunityIdFromUser,
  setSelectedCommunity,
  requireAuth,
  requireRole
} from "./auth";
import { createGHLBusiness, createGHLContact, updateGHLBusiness, archiveGHLBusiness, updateGHLContact, deactivateGHLContact, reactivateGHLContact, isGHLConfigured } from "./ghl";
import { 
  insertIncidentSchema,
  updateIncidentSchema,
  insertDocumentSchema,
  updateDocumentSchema,
  insertAgreementSchema,
  updateAgreementSchema,
  insertDerramaSchema,
  updateDerramaSchema,
  insertDerramaPaymentSchema,
  updateDerramaPaymentSchema,
  insertProviderSchema,
  updateProviderSchema,
  insertQuotaTypeSchema,
  updateQuotaTypeSchema,
  insertQuotaAssignmentSchema,
  updateQuotaAssignmentSchema,
  insertMeetingSchema,
  updateMeetingSchema,
  insertMeetingAgendaItemSchema,
  updateMeetingAgendaItemSchema,
  insertMeetingAttendanceSchema,
  updateMeetingAttendanceSchema,
  insertPropertyCompanySchema,
  insertCommunitySchema,
  updateCommunitySchema,
  insertUserSchema,
  superAdminUpdateUserSchema,
  createAdminWithPasswordSchema,
  users,
  type User,
  type Community
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, inArray } from "drizzle-orm";

let DEFAULT_PROPERTY_COMPANY_ID: string;
let DEFAULT_COMMUNITY_ID: string;

async function ensureDefaultData() {
  // Create property company
  let propertyCompany = await storage.getPropertyCompanyByDomain("demo");
  if (!propertyCompany) {
    try {
      propertyCompany = await storage.createPropertyCompany({
        name: "Gestión de Fincas Demo",
        domain: "demo",
        logo: null,
        primaryColor: "#8b5cf6",
        accentColor: "#fb923c",
      });
    } catch (error) {
      propertyCompany = await storage.getPropertyCompanyByDomain("demo");
    }
  }

  // Create communities
  const communities = await storage.getCommunities(propertyCompany!.id);
  let community;
  let community2;
  
  if (communities.length === 0) {
    try {
      community = await storage.createCommunity({
        propertyCompanyId: propertyCompany!.id,
        name: "Comunidad Residencial Las Flores",
        address: "Calle Mayor 123",
        postalCode: "28001",
        city: "Madrid",
        province: "Madrid",
        totalUnits: 48,
        presidentId: null,
      });
      
      community2 = await storage.createCommunity({
        propertyCompanyId: propertyCompany!.id,
        name: "Comunidad Los Pinos",
        address: "Avenida de la Constitución 45",
        postalCode: "28002",
        city: "Madrid",
        province: "Madrid",
        totalUnits: 36,
        presidentId: null,
      });
    } catch (error) {
      const communities = await storage.getCommunities(propertyCompany!.id);
      community = communities[0];
      community2 = communities[1];
    }
  } else {
    community = communities[0];
    community2 = communities[1] || community;
  }

  // Create superadmin user if it doesn't exist
  const superadminEmail = process.env.SUPERADMIN_EMAIL || "superadmin@administra.com";
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || "password";
  
  let superadminUser = await storage.getUserByEmail(superadminEmail);
  if (!superadminUser) {
    try {
      const passwordHash = await hashPassword(superadminPassword);
      superadminUser = await storage.createUser({
        email: superadminEmail,
        username: "superadmin",
        password: passwordHash,
        firstName: "Super",
        lastName: "Administrador",
        role: "superadmin",
        propertyCompanyId: null, // Superadmin has no company
        communityId: null, // Superadmin has no community
        unitNumber: null,
      });
      console.log(`✅ Created superadmin user: ${superadminEmail}`);
    } catch (error) {
      console.error("Error creating superadmin user:", error);
    }
  } else {
    // Verify password and update if needed
    const isPasswordValid = await verifyPassword(superadminPassword, superadminUser.password);
    if (!isPasswordValid) {
      const passwordHash = await hashPassword(superadminPassword);
      await storage.updateUserPassword(superadminUser.id, passwordHash);
      console.log(`✅ Updated password for superadmin user: ${superadminEmail}`);
    }
  }

  // Create test users if they don't exist, or update passwords if needed
  const adminEmail = "admin@gestiona.com";
  const presidenteEmail = "presidente@lasflores.com";
  const vecinoEmail = "vecino@lasflores.com";
  
  let adminUser = await storage.getUserByEmail(adminEmail);
  if (!adminUser) {
    try {
      const passwordHash = await hashPassword("password");
      adminUser = await storage.createUser({
        email: adminEmail,
        username: "admin",
        password: passwordHash,
        firstName: "Juan",
        lastName: "García - Administrador",
        role: "admin_fincas",
        propertyCompanyId: propertyCompany!.id,
        communityId: null,
        unitNumber: null,
      });
      console.log("✅ Created admin user: admin@gestiona.com");
    } catch (error) {
      console.error("Error creating admin user:", error);
    }
  } else {
    // Verify password and update if needed
    const isPasswordValid = await verifyPassword("password", adminUser.password);
    if (!isPasswordValid) {
      const passwordHash = await hashPassword("password");
      await storage.updateUserPassword(adminUser.id, passwordHash);
      console.log("✅ Updated password for admin user: admin@gestiona.com");
    }
  }
  
  let presidenteUser = await storage.getUserByEmail(presidenteEmail);
  if (!presidenteUser) {
    try {
      const passwordHash = await hashPassword("password");
      presidenteUser = await storage.createUser({
        email: presidenteEmail,
        username: "presidente",
        password: passwordHash,
        firstName: "María",
        lastName: "López - Presidente",
        role: "presidente",
        propertyCompanyId: null,
        communityId: community!.id,
        unitNumber: "1A",
      });
      console.log("✅ Created presidente user: presidente@lasflores.com");
    } catch (error) {
      console.error("Error creating presidente user:", error);
    }
  } else {
    // Verify password and update if needed
    const isPasswordValid = await verifyPassword("password", presidenteUser.password);
    if (!isPasswordValid) {
      const passwordHash = await hashPassword("password");
      await storage.updateUserPassword(presidenteUser.id, passwordHash);
      console.log("✅ Updated password for presidente user: presidente@lasflores.com");
    }
  }
  
  let vecinoUser = await storage.getUserByEmail(vecinoEmail);
  if (!vecinoUser) {
    try {
      const passwordHash = await hashPassword("password");
      vecinoUser = await storage.createUser({
        email: vecinoEmail,
        username: "vecino",
        password: passwordHash,
        firstName: "Pedro",
        lastName: "Martínez",
        role: "vecino",
        propertyCompanyId: null,
        communityId: community!.id,
        unitNumber: "2B",
      });
      console.log("✅ Created vecino user: vecino@lasflores.com");
    } catch (error) {
      console.error("Error creating vecino user:", error);
    }
  } else {
    // Verify password and update if needed
    const isPasswordValid = await verifyPassword("password", vecinoUser.password);
    if (!isPasswordValid) {
      const passwordHash = await hashPassword("password");
      await storage.updateUserPassword(vecinoUser.id, passwordHash);
      console.log("✅ Updated password for vecino user: vecino@lasflores.com");
    }
  }

  return { propertyCompany, community };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const { propertyCompany, community } = await ensureDefaultData();
  DEFAULT_PROPERTY_COMPANY_ID = propertyCompany!.id;
  DEFAULT_COMMUNITY_ID = community!.id;

  // Helper function to get communityId based on user role
  const getCommunityId = (req: Request) => {
    return getCommunityIdFromUser(req, DEFAULT_COMMUNITY_ID);
  };

  // ===== Authentication Endpoints =====
  
  // Register new user (only admin_fincas can register other users)
  app.post("/api/auth/register", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const { email, password, username, fullName, role, communityId, unitNumber } = req.body;

      // Validate required fields
      if (!email || !password || !username) {
        return res.status(400).json({ error: "Email, username, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Validate role assignment
      const requestedRole = role || "vecino";
      if (requestedRole === "admin_fincas" && currentUser.role !== "admin_fincas") {
        return res.status(403).json({ error: "Only admin_fincas can create other admin_fincas users" });
      }

      // Validate community assignment for presidente and vecino
      if ((requestedRole === "presidente" || requestedRole === "vecino") && !communityId) {
        return res.status(400).json({ error: "Community ID is required for presidente and vecino roles" });
      }

      // Verify community belongs to admin's property company
      if (communityId) {
        const community = await storage.getCommunity(communityId);
        if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
          return res.status(404).json({ error: "Community not found or not accessible" });
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const userData = insertUserSchema.parse({
        email: email.toLowerCase(),
        username,
        password: passwordHash,
        fullName: fullName || null,
        role: requestedRole,
        communityId: communityId || null,
        propertyCompanyId: requestedRole === "admin_fincas" ? currentUser.propertyCompanyId : null,
        unitNumber: unitNumber || null,
      });

      const user = await storage.createUser(userData);

      // Sync to GoHighLevel CRM (async, non-blocking)
      if (isGHLConfigured()) {
        const community = communityId ? await storage.getCommunity(communityId) : null;
        createGHLContact(user, community || null).then(async (ghlContactId) => {
          if (ghlContactId) {
            await storage.updateUserGHLId(user.id, ghlContactId);
            console.log(`[GHL] User ${user.id} synced with contact ${ghlContactId}`);
          }
        }).catch((err) => {
          console.error("[GHL] Failed to sync user:", err);
        });
        
        // Update community's GHL business with new resident count
        if (community && community.ghlBusinessId) {
          storage.countResidentsByCommunity(community.id).then(residentCount => {
            updateGHLBusiness(community.ghlBusinessId!, {}, residentCount).catch(err => {
              console.error("[GHL] Failed to update community resident count:", err);
            });
          }).catch(err => {
            console.error("[GHL] Failed to get resident count:", err);
          });
        }
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Internal server error" });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as User;
    const { password: _, ...userWithoutPassword } = user;
    
    // Include selected community for admin_fincas
    const selectedCommunityId = (req.session as any)?.selectedCommunityId;
    
    res.json({
      ...userWithoutPassword,
      selectedCommunityId: selectedCommunityId || null,
    });
  });

  // Select community (for admin_fincas users)
  app.post("/api/auth/select-community", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { communityId } = req.body;

      if (!communityId) {
        return res.status(400).json({ error: "communityId is required" });
      }

      // Only admin_fincas can select different communities
      if (user.role !== "admin_fincas") {
        return res.status(403).json({ error: "Only admin_fincas users can select communities" });
      }

      // Verify community belongs to the user's property company
      const community = await storage.getCommunity(communityId);
      if (!community || community.propertyCompanyId !== user.propertyCompanyId) {
        return res.status(404).json({ error: "Community not found or not accessible" });
      }

      // Set selected community in session
      setSelectedCommunity(req, communityId);

      // Explicitly save the session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json({ message: "Community selected", communityId });
      });
    } catch (error) {
      console.error("Error selecting community:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get communities for current user (admin_fincas gets all their communities)
  app.get("/api/auth/communities", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;

      if (user.role === "admin_fincas" && user.propertyCompanyId) {
        // Admin gets all communities from their property company
        const communities = await storage.getCommunities(user.propertyCompanyId);
        res.json(communities);
      } else if (user.communityId) {
        // Presidente and vecino only see their community
        const community = await storage.getCommunity(user.communityId);
        res.json(community ? [community] : []);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new community (admin_fincas only)
  app.post("/api/communities", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      if (!user.propertyCompanyId) {
        return res.status(400).json({ error: "User is not associated with a property company" });
      }

      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        propertyCompanyId: user.propertyCompanyId, // Always use the user's property company
      });

      const community = await storage.createCommunity(validatedData);

      // Sync to GoHighLevel CRM (async, non-blocking)
      if (isGHLConfigured()) {
        // New community starts with 0 residents
        createGHLBusiness(community, 0).then(async (ghlBusinessId) => {
          if (ghlBusinessId) {
            await storage.updateCommunityGHLId(community.id, ghlBusinessId);
            console.log(`[GHL] Community ${community.id} synced with business ${ghlBusinessId}`);
          }
        }).catch((err) => {
          console.error("[GHL] Failed to sync community:", err);
        });
      }

      res.status(201).json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating community:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get a specific community by ID
  app.get("/api/communities/:id", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const community = await storage.getCommunity(req.params.id);
      
      if (!community) {
        return res.status(404).json({ error: "Community not found" });
      }

      // Verify the community belongs to the user's property company
      if (community.propertyCompanyId !== user.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(community);
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a community (admin_fincas only)
  app.patch("/api/communities/:id", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      if (!user.propertyCompanyId) {
        return res.status(400).json({ error: "User is not associated with a property company" });
      }

      const validatedData = updateCommunitySchema.parse(req.body);
      const community = await storage.updateCommunity(req.params.id, user.propertyCompanyId, validatedData);
      
      if (!community) {
        return res.status(404).json({ error: "Community not found or access denied" });
      }

      // Sync changes to GHL if configured and community has a GHL Business ID
      if (isGHLConfigured() && community.ghlBusinessId) {
        // Get current resident count for description
        storage.countResidentsByCommunity(community.id).then(residentCount => {
          updateGHLBusiness(community.ghlBusinessId!, validatedData, residentCount).catch(err => {
            console.error("[GHL] Failed to sync community update:", err);
          });
        }).catch(err => {
          console.error("[GHL] Failed to get resident count:", err);
          // Still sync without resident count
          updateGHLBusiness(community.ghlBusinessId!, validatedData).catch(err => {
            console.error("[GHL] Failed to sync community update:", err);
          });
        });
      }

      res.json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating community:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a community (admin_fincas only)
  app.delete("/api/communities/:id", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      if (!user.propertyCompanyId) {
        return res.status(400).json({ error: "User is not associated with a property company" });
      }

      // Get community first to retrieve GHL Business ID before deletion
      const community = await storage.getCommunity(req.params.id);
      const ghlBusinessId = community?.ghlBusinessId;

      const deleted = await storage.deleteCommunity(req.params.id, user.propertyCompanyId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Community not found or access denied" });
      }

      // Archive the business in GHL (mark as inactive, don't delete)
      if (isGHLConfigured() && ghlBusinessId) {
        archiveGHLBusiness(ghlBusinessId, community?.name).catch(err => {
          console.error("[GHL] Failed to archive business:", err);
        });
      }

      res.json({ success: true, message: "Community deleted successfully" });
    } catch (error) {
      console.error("Error deleting community:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current selected community
  app.get("/api/auth/current-community", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const communityId = getCommunityIdFromUser(req, DEFAULT_COMMUNITY_ID);
      
      if (!communityId) {
        return res.json(null);
      }

      const community = await storage.getCommunity(communityId);
      res.json(community);
    } catch (error) {
      console.error("Error fetching current community:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== Protected Business Endpoints =====

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const stats = await storage.getDashboardStats(communityId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Recent activity endpoint (admin_fincas and presidente only)
  app.get("/api/dashboard/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      // Only admin_fincas and presidente can see activity feed
      if (user.role !== 'admin_fincas' && user.role !== 'presidente') {
        return res.status(403).json({ error: "Access denied" });
      }
      const communityId = getCommunityId(req);
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(communityId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Incidents endpoints
  app.get("/api/incidents", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const incidents = await storage.getIncidents(communityId);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/incidents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const incident = await storage.getIncident(req.params.id, communityId);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/incidents", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = insertIncidentSchema.parse({ ...req.body, communityId });
      const incident = await storage.createIncident(data);
      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/incidents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateIncidentSchema.parse(req.body);
      const incident = await storage.updateIncident(req.params.id, communityId, data);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/incidents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteIncident(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Documents endpoints
  app.get("/api/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const documents = await storage.getDocuments(communityId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const document = await storage.getDocument(req.params.id, communityId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = insertDocumentSchema.parse({ ...req.body, communityId });
      const document = await storage.createDocument(data);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateDocumentSchema.parse(req.body);
      const document = await storage.updateDocument(req.params.id, communityId, data);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteDocument(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Agreements endpoints
  app.get("/api/agreements", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const agreements = await storage.getAgreements(communityId);
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/agreements", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = insertAgreementSchema.parse({ ...req.body, communityId });
      const agreement = await storage.createAgreement(data);
      res.status(201).json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating agreement:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/agreements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateAgreementSchema.parse(req.body);
      const agreement = await storage.updateAgreement(req.params.id, communityId, data);
      if (!agreement) {
        return res.status(404).json({ error: "Agreement not found" });
      }
      res.json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating agreement:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/agreements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteAgreement(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Agreement not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting agreement:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Derramas endpoints
  app.get("/api/derramas", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const derramas = await storage.getDerramas(communityId);
      res.json(derramas);
    } catch (error) {
      console.error("Error fetching derramas:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/derramas/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const derrama = await storage.getDerrama(req.params.id, communityId);
      if (!derrama) {
        return res.status(404).json({ error: "Derrama not found" });
      }
      res.json(derrama);
    } catch (error) {
      console.error("Error fetching derrama:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/derramas", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = insertDerramaSchema.parse({ ...req.body, communityId });
      const derrama = await storage.createDerrama(data);
      res.status(201).json(derrama);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating derrama:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/derramas/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateDerramaSchema.parse(req.body);
      const derrama = await storage.updateDerrama(req.params.id, communityId, data);
      if (!derrama) {
        return res.status(404).json({ error: "Derrama not found" });
      }
      res.json(derrama);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating derrama:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/derramas/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteDerrama(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Derrama not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting derrama:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Derrama Payments endpoints
  app.get("/api/derramas/:derramaId/payments", requireAuth, async (req: Request, res: Response) => {
    try {
      const payments = await storage.getDerramaPayments(req.params.derramaId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/derramas/:derramaId/payments", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertDerramaPaymentSchema.parse({ 
        ...req.body, 
        derramaId: req.params.derramaId 
      });
      const payment = await storage.createDerramaPayment(data);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/derrama-payments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateDerramaPaymentSchema.parse(req.body);
      const payment = await storage.updateDerramaPayment(req.params.id, communityId, data);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Providers endpoints
  app.get("/api/providers", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const providers = await storage.getProviders(communityId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/providers/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const provider = await storage.getProvider(req.params.id, communityId);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/providers", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = insertProviderSchema.parse({ ...req.body, communityId });
      const provider = await storage.createProvider(data);
      res.status(201).json(provider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating provider:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/providers/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateProviderSchema.parse(req.body);
      const provider = await storage.updateProvider(req.params.id, communityId, data);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating provider:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/providers/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteProvider(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Users endpoints

  // Get all users - for admin_fincas lists all community users, for vecinos lists their community members
  app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      
      // Admin_fincas can see all users in their managed communities
      if (currentUser.role === "admin_fincas") {
        // Get all communities for this property company
        const managedCommunities = await storage.getCommunities(currentUser.propertyCompanyId!);
        const communityIds = managedCommunities.map(c => c.id);
        
        if (communityIds.length === 0) {
          return res.json([]);
        }
        
        // Get all users in these communities
        const allUsers = await db.select().from(users)
          .where(inArray(users.communityId, communityIds))
          .orderBy(desc(users.createdAt));
        
        const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
        return res.json(usersWithoutPasswords);
      }
      
      // For vecinos/presidentes, only show their community members (limited info)
      const communityId = getCommunityId(req);
      const allUsers = await db.select().from(users)
        .where(eq(users.communityId, communityId))
        .orderBy(desc(users.createdAt));
      
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new user (admin_fincas only for their communities)
  app.post("/api/users", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      
      if (!currentUser.propertyCompanyId) {
        return res.status(400).json({ error: "Admin not associated with a property company" });
      }

      const { username, email, password, firstName, lastName, phone, dateOfBirth, unitNumber, role, communityId } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !communityId || !firstName || !lastName) {
        return res.status(400).json({ error: "Username, email, password, firstName, lastName, and community are required" });
      }

      // Verify the community belongs to this admin's property company
      const community = await storage.getCommunity(communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied - community not managed by your company" });
      }

      // Check for existing user with same email or username
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "A user with this username already exists" });
      }

      // Validate role
      const validRole = role === "presidente" ? "presidente" : "vecino";
      
      // Hash password and create user
      const passwordHash = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        unitNumber: unitNumber || null,
        role: validRole,
        communityId,
      });

      // Sync to GHL
      if (isGHLConfigured()) {
        const ghlContactId = await createGHLContact(newUser, community);
        if (ghlContactId) {
          await storage.updateUserGHLId(newUser.id, ghlContactId);
        }
        
        // Update community's GHL business with new resident count
        if (community.ghlBusinessId) {
          storage.countResidentsByCommunity(community.id).then(residentCount => {
            updateGHLBusiness(community.ghlBusinessId!, {}, residentCount).catch(err => {
              console.error("[GHL] Failed to update community resident count:", err);
            });
          }).catch(err => {
            console.error("[GHL] Failed to get resident count:", err);
          });
        }
      }

      const { password: _, ...sanitizedUser } = newUser;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Self-update - users can update their own profile info (MUST be before /:id route)
  app.patch("/api/users/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const { firstName, lastName, email, phone } = req.body;
      
      const updateData: Record<string, unknown> = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;

      const updatedUser = await storage.updateUser(currentUser.id, updateData);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update profile" });
      }

      // Sync changes to GHL if configured
      if (isGHLConfigured() && updatedUser.ghlContactId) {
        updateGHLContact(updatedUser.ghlContactId, updateData).catch(err => {
          console.error("[GHL] Failed to sync user update:", err);
        });
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a user (admin_fincas only for users in their communities)
  app.patch("/api/users/:id", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Users without a communityId cannot be managed by admin_fincas
      if (!targetUser.communityId) {
        return res.status(403).json({ error: "Access denied - user is not a community member" });
      }

      // Verify the user belongs to a community managed by this admin's property company
      const community = await storage.getCommunity(targetUser.communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { firstName, lastName, email, phone, dateOfBirth, unitNumber, role, communityId } = req.body;
      const updateData: Record<string, unknown> = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
      if (unitNumber !== undefined) updateData.unitNumber = unitNumber;
      if (role !== undefined && (role === "vecino" || role === "presidente")) {
        updateData.role = role;
      }
      
      // Handle community transfer if provided
      let newCommunity: Community | null = null;
      if (communityId !== undefined && communityId !== targetUser.communityId) {
        // Verify new community belongs to this admin's property company
        const targetCommunity = await storage.getCommunity(communityId);
        if (!targetCommunity || targetCommunity.propertyCompanyId !== currentUser.propertyCompanyId) {
          return res.status(403).json({ error: "Access denied - cannot transfer to this community" });
        }
        updateData.communityId = communityId;
        newCommunity = targetCommunity;
      }

      const updatedUser = await storage.updateUser(req.params.id, updateData);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      // Sync changes to GHL if configured and user has a GHL Contact ID
      if (isGHLConfigured() && updatedUser.ghlContactId) {
        // Only pass community if:
        // 1. User was transferred to a new community (newCommunity is set), OR
        // 2. User didn't change community but we need to include current community name
        // We DON'T pass undefined to avoid accidentally clearing companyName
        let communityForGHL: Community | null | undefined = undefined;
        if (newCommunity) {
          // User was transferred to a new community
          communityForGHL = newCommunity;
        }
        // Note: We only pass community when it changes (newCommunity), 
        // otherwise we don't include it in the update to preserve existing companyName
        updateGHLContact(updatedUser.ghlContactId, updateData, communityForGHL).catch(err => {
          console.error("[GHL] Failed to sync user update:", err);
        });
        
        // If user was transferred, update both old and new community resident counts
        if (newCommunity) {
          // Update old community's resident count
          if (community.ghlBusinessId) {
            storage.countResidentsByCommunity(community.id).then(residentCount => {
              updateGHLBusiness(community.ghlBusinessId!, {}, residentCount).catch(err => {
                console.error("[GHL] Failed to update old community resident count:", err);
              });
            }).catch(err => {
              console.error("[GHL] Failed to get old community resident count:", err);
            });
          }
          // Update new community's resident count
          if (newCommunity.ghlBusinessId) {
            storage.countResidentsByCommunity(newCommunity.id).then(residentCount => {
              updateGHLBusiness(newCommunity.ghlBusinessId!, {}, residentCount).catch(err => {
                console.error("[GHL] Failed to update new community resident count:", err);
              });
            }).catch(err => {
              console.error("[GHL] Failed to get new community resident count:", err);
            });
          }
        }
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Password reset - admin can set password for users in their communities
  app.patch("/api/users/:id/password", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Users without a communityId cannot be managed by admin_fincas
      if (!targetUser.communityId) {
        return res.status(403).json({ error: "Access denied - user is not a community member" });
      }

      // Verify the user belongs to a community managed by this admin's property company
      const community = await storage.getCommunity(targetUser.communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(targetUser.id, passwordHash);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reactivate a user (restore deactivated accounts)
  app.post("/api/users/:id/reactivate", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Users without a communityId cannot be managed by admin_fincas
      if (!targetUser.communityId) {
        return res.status(403).json({ error: "Access denied - user is not a community member" });
      }

      // Verify the user belongs to a community managed by this admin's property company
      const community = await storage.getCommunity(targetUser.communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Mark user as active in database
      const updatedUser = await storage.updateUser(req.params.id, { active: true });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to reactivate user" });
      }

      // Restore role tag in GHL (remove Ex-Residente tag)
      if (isGHLConfigured() && targetUser.ghlContactId) {
        reactivateGHLContact(targetUser.ghlContactId, targetUser.role).catch(err => {
          console.error("[GHL] Failed to reactivate contact:", err);
        });
        
        // Update community's GHL business with new resident count
        if (community.ghlBusinessId) {
          storage.countResidentsByCommunity(community.id).then(residentCount => {
            updateGHLBusiness(community.ghlBusinessId!, {}, residentCount).catch(err => {
              console.error("[GHL] Failed to update community resident count:", err);
            });
          }).catch(err => {
            console.error("[GHL] Failed to get resident count:", err);
          });
        }
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json({ success: true, message: "User reactivated successfully", user: sanitizedUser });
    } catch (error) {
      console.error("Error reactivating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Deactivate a user (marks as Ex-Residente in GHL, never deletes)
  app.post("/api/users/:id/deactivate", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Users without a communityId cannot be managed by admin_fincas
      if (!targetUser.communityId) {
        return res.status(403).json({ error: "Access denied - user is not a community member" });
      }

      // Verify the user belongs to a community managed by this admin's property company
      const community = await storage.getCommunity(targetUser.communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Mark user as inactive in database
      const updatedUser = await storage.updateUser(req.params.id, { active: false });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to deactivate user" });
      }

      // Mark as Ex-Residente in GHL (never delete contacts)
      if (isGHLConfigured() && targetUser.ghlContactId) {
        deactivateGHLContact(targetUser.ghlContactId, targetUser.role).catch(err => {
          console.error("[GHL] Failed to deactivate contact:", err);
        });
        
        // Update community's GHL business with new resident count
        if (community.ghlBusinessId) {
          storage.countResidentsByCommunity(community.id).then(residentCount => {
            updateGHLBusiness(community.ghlBusinessId!, {}, residentCount).catch(err => {
              console.error("[GHL] Failed to update community resident count:", err);
            });
          }).catch(err => {
            console.error("[GHL] Failed to get resident count:", err);
          });
        }
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json({ success: true, message: "User deactivated successfully", user: sanitizedUser });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user notes (admin_fincas only)
  app.patch("/api/users/:id/notes", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Users without a communityId cannot be managed by admin_fincas
      if (!targetUser.communityId) {
        return res.status(403).json({ error: "Access denied - user is not a community member" });
      }

      // Verify the user belongs to a community managed by this admin's property company
      const community = await storage.getCommunity(targetUser.communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { notes } = req.body;
      if (typeof notes !== 'string') {
        return res.status(400).json({ error: "Notes must be a string" });
      }

      const updatedUser = await storage.updateUserNotes(req.params.id, notes);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update notes" });
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json({ success: true, message: "Notes updated successfully", user: sanitizedUser });
    } catch (error) {
      console.error("Error updating user notes:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Permanently delete a user (admin_fincas only) - marks as Ex-Residente in GHL, then deletes from DB
  app.delete("/api/users/:id/permanent", requireRole("admin_fincas"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Users without a communityId cannot be managed by admin_fincas
      if (!targetUser.communityId) {
        return res.status(403).json({ error: "Access denied - user is not a community member" });
      }

      // Verify the user belongs to a community managed by this admin's property company
      const community = await storage.getCommunity(targetUser.communityId);
      if (!community || community.propertyCompanyId !== currentUser.propertyCompanyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // First, mark as Ex-Residente in GHL (contact is kept in GHL, not deleted)
      if (isGHLConfigured() && targetUser.ghlContactId) {
        try {
          await deactivateGHLContact(targetUser.ghlContactId, targetUser.role);
        } catch (err) {
          console.error("[GHL] Failed to mark contact as Ex-Residente:", err);
        }
      }

      // Permanently delete from database
      const deleted = await storage.deleteUserPermanently(req.params.id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete user" });
      }

      // Update community's GHL business with new resident count
      if (isGHLConfigured() && community.ghlBusinessId) {
        storage.countResidentsByCommunity(community.id).then(residentCount => {
          updateGHLBusiness(community.ghlBusinessId!, {}, residentCount).catch(err => {
            console.error("[GHL] Failed to update community resident count:", err);
          });
        }).catch(err => {
          console.error("[GHL] Failed to get resident count:", err);
        });
      }

      res.json({ success: true, message: "User permanently deleted" });
    } catch (error) {
      console.error("Error deleting user permanently:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Quota Types endpoints
  app.get("/api/quota-types", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const quotaTypes = await storage.getQuotaTypes(communityId);
      res.json(quotaTypes);
    } catch (error) {
      console.error("Error fetching quota types:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quota-types/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const quotaType = await storage.getQuotaType(req.params.id, communityId);
      if (!quotaType) {
        return res.status(404).json({ error: "Quota type not found" });
      }
      res.json(quotaType);
    } catch (error) {
      console.error("Error fetching quota type:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quota-types", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = insertQuotaTypeSchema.parse({ ...req.body, communityId });
      const quotaType = await storage.createQuotaType(data);
      res.status(201).json(quotaType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating quota type:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/quota-types/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateQuotaTypeSchema.parse(req.body);
      const quotaType = await storage.updateQuotaType(req.params.id, communityId, data);
      if (!quotaType) {
        return res.status(404).json({ error: "Quota type not found" });
      }
      res.json(quotaType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating quota type:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/quota-types/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteQuotaType(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Quota type not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quota type:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Quota Assignments endpoints
  app.get("/api/quota-assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const assignments = await storage.getQuotaAssignments(communityId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching quota assignments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quota-assignments/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const assignments = await storage.getQuotaAssignmentsByUser(req.params.userId, communityId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user quota assignments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quota-assignments/quota-type/:quotaTypeId", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const assignments = await storage.getQuotaAssignmentsByQuotaType(req.params.quotaTypeId, communityId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching quota type assignments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quota-assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const assignment = await storage.getQuotaAssignment(req.params.id, communityId);
      if (!assignment) {
        return res.status(404).json({ error: "Quota assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching quota assignment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quota-assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      
      // Transform frontend data to match backend schema expectations
      const transformedData = {
        ...req.body,
        communityId,
        // Convert number amount to string for decimal field
        amount: req.body.amount !== undefined ? String(req.body.amount) : undefined,
        // Convert ISO date string to Date object
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : undefined,
      };
      
      const data = insertQuotaAssignmentSchema.parse(transformedData);
      const assignment = await storage.createQuotaAssignment(data);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating quota assignment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/quota-assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      
      // Transform frontend data to match backend schema expectations
      const transformedData = {
        ...req.body,
        // Convert number amount to string for decimal field
        amount: req.body.amount !== undefined ? String(req.body.amount) : undefined,
        // Convert ISO date strings to Date objects
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : undefined,
      };
      
      const data = updateQuotaAssignmentSchema.parse(transformedData);
      const assignment = await storage.updateQuotaAssignment(req.params.id, communityId, data);
      if (!assignment) {
        return res.status(404).json({ error: "Quota assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating quota assignment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/quota-assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteQuotaAssignment(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Quota assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quota assignment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== Meetings Endpoints =====
  
  // Get all meetings for a community
  app.get("/api/meetings", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const meetings = await storage.getMeetings(communityId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get a single meeting
  app.get("/api/meetings/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const meeting = await storage.getMeeting(req.params.id, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new meeting
  app.post("/api/meetings", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const defaultCommunityId = getCommunityId(req);
      
      let communityId = defaultCommunityId;
      
      // If admin_fincas submits a specific communityId, validate it belongs to their property company
      if (currentUser.role === "admin_fincas" && req.body.communityId) {
        const requestedCommunity = await storage.getCommunity(req.body.communityId);
        
        // Verify the community exists and belongs to the admin's property company
        if (!requestedCommunity || requestedCommunity.propertyCompanyId !== currentUser.propertyCompanyId) {
          return res.status(404).json({ error: "Community not found or not accessible" });
        }
        
        communityId = req.body.communityId;
      }
      
      const data = insertMeetingSchema.parse({ 
        ...req.body, 
        communityId,
        createdBy: currentUser.id
      });
      const meeting = await storage.createMeeting(data);
      res.status(201).json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating meeting:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a meeting
  app.patch("/api/meetings/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const data = updateMeetingSchema.parse(req.body);
      const meeting = await storage.updateMeeting(req.params.id, communityId, data);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating meeting:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a meeting
  app.delete("/api/meetings/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const deleted = await storage.deleteMeeting(req.params.id, communityId);
      if (!deleted) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== Meeting Agenda Items Endpoints =====
  
  // Get all agenda items for a meeting
  app.get("/api/meetings/:meetingId/agenda-items", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const agendaItems = await storage.getMeetingAgendaItems(req.params.meetingId);
      res.json(agendaItems);
    } catch (error) {
      console.error("Error fetching agenda items:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new agenda item
  app.post("/api/meetings/:meetingId/agenda-items", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const data = insertMeetingAgendaItemSchema.parse({
        ...req.body,
        meetingId: req.params.meetingId
      });
      const agendaItem = await storage.createMeetingAgendaItem(data);
      res.status(201).json(agendaItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating agenda item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update an agenda item
  app.patch("/api/meetings/:meetingId/agenda-items/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const data = updateMeetingAgendaItemSchema.parse(req.body);
      const agendaItem = await storage.updateMeetingAgendaItem(
        req.params.id, 
        req.params.meetingId, 
        data
      );
      if (!agendaItem) {
        return res.status(404).json({ error: "Agenda item not found" });
      }
      res.json(agendaItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating agenda item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete an agenda item
  app.delete("/api/meetings/:meetingId/agenda-items/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const deleted = await storage.deleteMeetingAgendaItem(req.params.id, req.params.meetingId);
      if (!deleted) {
        return res.status(404).json({ error: "Agenda item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting agenda item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== Meeting Attendances Endpoints =====
  
  // Get all attendances for a meeting
  app.get("/api/meetings/:meetingId/attendances", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const attendances = await storage.getMeetingAttendances(req.params.meetingId);
      res.json(attendances);
    } catch (error) {
      console.error("Error fetching attendances:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new attendance record
  app.post("/api/meetings/:meetingId/attendances", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const data = insertMeetingAttendanceSchema.parse({
        ...req.body,
        meetingId: req.params.meetingId
      });
      const attendance = await storage.createMeetingAttendance(data);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating attendance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update an attendance record
  app.patch("/api/meetings/:meetingId/attendances/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const data = updateMeetingAttendanceSchema.parse(req.body);
      const attendance = await storage.updateMeetingAttendance(
        req.params.id, 
        req.params.meetingId, 
        data
      );
      if (!attendance) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating attendance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete an attendance record
  app.delete("/api/meetings/:meetingId/attendances/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      // Verify the meeting belongs to the user's community
      const meeting = await storage.getMeeting(req.params.meetingId, communityId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const deleted = await storage.deleteMeetingAttendance(req.params.id, req.params.meetingId);
      if (!deleted) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== SUPERADMIN ROUTES ==========
  // These routes are only accessible to users with the superadmin role
  
  // Get superadmin dashboard stats
  app.get("/api/superadmin/stats", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const stats = await storage.getSuperadminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching superadmin stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all property companies
  app.get("/api/superadmin/property-companies", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const companies = await storage.getAllPropertyCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching property companies:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new property company
  app.post("/api/superadmin/property-companies", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const data = insertPropertyCompanySchema.parse(req.body);
      const company = await storage.createPropertyCompany(data);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating property company:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a property company
  app.patch("/api/superadmin/property-companies/:id", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const data = insertPropertyCompanySchema.partial().parse(req.body);
      const company = await storage.updatePropertyCompany(req.params.id, data);
      if (!company) {
        return res.status(404).json({ error: "Property company not found" });
      }
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating property company:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a property company
  app.delete("/api/superadmin/property-companies/:id", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      // Check if there are any communities associated with this company
      const communities = await storage.getCommunities(req.params.id);
      if (communities.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete property company",
          message: `This property company has ${communities.length} community/communities. Please delete them first to prevent data loss.`
        });
      }
      
      // Check if there are any admin_fincas users associated with this company
      const admins = await storage.getAdminFincasUsers(req.params.id);
      if (admins.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete property company",
          message: `This property company has ${admins.length} admin user(s). Please reassign or delete them first.`
        });
      }
      
      const deleted = await storage.deletePropertyCompany(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Property company not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting property company:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all admin_fincas users (optionally filtered by property company)
  app.get("/api/superadmin/admins", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const propertyCompanyId = req.query.propertyCompanyId as string | undefined;
      const admins = await storage.getAdminFincasUsers(propertyCompanyId);
      // Strip password hashes from response
      const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new admin_fincas user
  app.post("/api/superadmin/admins", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      // Validate and parse request body with strong password requirements
      const data = createAdminWithPasswordSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Verify property company exists
      const company = await storage.getPropertyCompany(data.propertyCompanyId);
      if (!company) {
        return res.status(404).json({ error: "Property company not found" });
      }

      // Hash password securely before storage
      const hashedPassword = await hashPassword(data.password);
      
      const userData = {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "admin_fincas" as const,
        propertyCompanyId: data.propertyCompanyId,
        communityId: null, // admin_fincas users have no community
        unitNumber: null,
      };

      const user = await storage.createUser(userData);
      
      // Strip password from response
      const { password: _, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error("Error creating admin user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => e.message).join(", ")
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update an admin user (safe update without password)
  app.patch("/api/superadmin/admins/:id", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const data = superAdminUpdateUserSchema.parse(req.body);
      
      // Get existing user to check current state
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Validate propertyCompanyId if provided
      if (data.propertyCompanyId !== undefined && data.propertyCompanyId !== null) {
        const company = await storage.getPropertyCompany(data.propertyCompanyId);
        if (!company) {
          return res.status(404).json({ error: "Property company not found" });
        }
      }
      
      // Determine final role and propertyCompanyId after update
      const finalRole = data.role !== undefined ? data.role : existingUser.role;
      const finalPropertyCompanyId = data.propertyCompanyId !== undefined 
        ? data.propertyCompanyId 
        : existingUser.propertyCompanyId;
      
      // If changing to/is admin_fincas, ensure propertyCompanyId is set
      if (finalRole === "admin_fincas" && finalPropertyCompanyId === null) {
        return res.status(400).json({ 
          error: "admin_fincas users must have a propertyCompanyId",
          message: "Please provide a propertyCompanyId when setting role to admin_fincas"
        });
      }
      
      // If changing to superadmin, ensure propertyCompanyId is null
      if (finalRole === "superadmin" && finalPropertyCompanyId !== null) {
        return res.status(400).json({ error: "superadmin users cannot have a propertyCompanyId" });
      }
      
      const user = await storage.updateUser(req.params.id, data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Sync changes to GHL if configured and user has a GHL Contact ID
      if (isGHLConfigured() && user.ghlContactId) {
        updateGHLContact(user.ghlContactId, data).catch(err => {
          console.error("[GHL] Failed to sync user update:", err);
        });
      }

      // Strip password from response
      const { password: _, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating admin user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Deactivate an admin user (marks as Ex-Residente in GHL)
  app.post("/api/superadmin/admins/:id/deactivate", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Mark user as inactive in database
      const updatedUser = await storage.updateUser(req.params.id, { active: false });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to deactivate user" });
      }

      // Mark as Ex-Residente in GHL (never delete contacts)
      if (isGHLConfigured() && user.ghlContactId) {
        deactivateGHLContact(user.ghlContactId, user.role).catch(err => {
          console.error("[GHL] Failed to deactivate contact:", err);
        });
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json({ success: true, message: "User deactivated successfully", user: sanitizedUser });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Change admin user password (secure endpoint)
  app.post("/api/superadmin/admins/:id/change-password", requireRole("superadmin"), async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(req.params.id, hashedPassword);
      
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return createServer(app);
}
