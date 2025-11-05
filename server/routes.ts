import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { 
  hashPassword,
  getUserContext,
  getCommunityIdFromUser,
  setSelectedCommunity,
  requireAuth,
  requireRole
} from "./auth";
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
  insertPropertyCompanySchema,
  insertCommunitySchema,
  insertUserSchema,
  type User
} from "@shared/schema";
import { z } from "zod";

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

  // Create community
  const communities = await storage.getCommunities(propertyCompany!.id);
  let community;
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
    } catch (error) {
      const communities = await storage.getCommunities(propertyCompany!.id);
      community = communities[0];
    }
  } else {
    community = communities[0];
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
      const data = insertQuotaAssignmentSchema.parse({ ...req.body, communityId });
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
      const data = updateQuotaAssignmentSchema.parse(req.body);
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

  return createServer(app);
}
