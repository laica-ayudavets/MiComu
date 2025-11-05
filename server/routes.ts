import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertPropertyCompanySchema,
  insertCommunitySchema,
  insertUserSchema
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

  // Helper function to get communityId
  // In a real implementation, this would check user role and permissions
  // For now, we default to the demo community
  const getCommunityId = (req: Request) => {
    return (req.user as any)?.communityId || DEFAULT_COMMUNITY_ID;
  };

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
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
  app.get("/api/incidents", async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const incidents = await storage.getIncidents(communityId);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/incidents/:id", async (req: Request, res: Response) => {
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

  app.post("/api/incidents", async (req: Request, res: Response) => {
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

  app.patch("/api/incidents/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/incidents/:id", async (req: Request, res: Response) => {
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
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const documents = await storage.getDocuments(communityId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
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

  app.post("/api/documents", async (req: Request, res: Response) => {
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

  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
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
  app.get("/api/agreements", async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const agreements = await storage.getAgreements(communityId);
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/agreements", async (req: Request, res: Response) => {
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

  app.patch("/api/agreements/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/agreements/:id", async (req: Request, res: Response) => {
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
  app.get("/api/derramas", async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const derramas = await storage.getDerramas(communityId);
      res.json(derramas);
    } catch (error) {
      console.error("Error fetching derramas:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/derramas/:id", async (req: Request, res: Response) => {
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

  app.post("/api/derramas", async (req: Request, res: Response) => {
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

  app.patch("/api/derramas/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/derramas/:id", async (req: Request, res: Response) => {
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
  app.get("/api/derramas/:derramaId/payments", async (req: Request, res: Response) => {
    try {
      const payments = await storage.getDerramaPayments(req.params.derramaId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/derramas/:derramaId/payments", async (req: Request, res: Response) => {
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

  app.patch("/api/derrama-payments/:id", async (req: Request, res: Response) => {
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
  app.get("/api/providers", async (req: Request, res: Response) => {
    try {
      const communityId = getCommunityId(req);
      const providers = await storage.getProviders(communityId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/providers/:id", async (req: Request, res: Response) => {
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

  app.post("/api/providers", async (req: Request, res: Response) => {
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

  app.patch("/api/providers/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/providers/:id", async (req: Request, res: Response) => {
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

  return createServer(app);
}
