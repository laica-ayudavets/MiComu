import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertIncidentSchema,
  insertDocumentSchema,
  insertAgreementSchema,
  insertDerramaSchema,
  insertDerramaPaymentSchema,
  insertProviderSchema,
  insertTenantSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

const DEFAULT_TENANT_ID = "default-tenant";

async function ensureDefaultTenant() {
  let tenant = await storage.getTenant(DEFAULT_TENANT_ID);
  if (!tenant) {
    tenant = await storage.createTenant({
      name: "Comunidad Demo",
      domain: "demo",
      logo: null,
      primaryColor: "#8b5cf6",
      accentColor: "#fb923c",
    });
  }
  return tenant;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureDefaultTenant();

  const getTenantId = (req: Request) => {
    return (req.user as any)?.tenantId || DEFAULT_TENANT_ID;
  };

  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const stats = await storage.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/incidents", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const incidents = await storage.getIncidents(tenantId);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const incident = await storage.getIncident(req.params.id, tenantId);
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
      const tenantId = getTenantId(req);
      const data = insertIncidentSchema.parse({ ...req.body, tenantId });
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
      const tenantId = getTenantId(req);
      const incident = await storage.updateIncident(req.params.id, tenantId, req.body);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const deleted = await storage.deleteIncident(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const documents = await storage.getDocuments(tenantId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const document = await storage.getDocument(req.params.id, tenantId);
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
      const tenantId = getTenantId(req);
      const data = insertDocumentSchema.parse({ ...req.body, tenantId });
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
      const tenantId = getTenantId(req);
      const document = await storage.updateDocument(req.params.id, tenantId, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const deleted = await storage.deleteDocument(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/agreements", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { documentId } = req.query;
      
      const agreements = documentId 
        ? await storage.getAgreementsByDocument(documentId as string, tenantId)
        : await storage.getAgreements(tenantId);
      
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/agreements", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const data = insertAgreementSchema.parse({ ...req.body, tenantId });
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
      const tenantId = getTenantId(req);
      const agreement = await storage.updateAgreement(req.params.id, tenantId, req.body);
      if (!agreement) {
        return res.status(404).json({ error: "Agreement not found" });
      }
      res.json(agreement);
    } catch (error) {
      console.error("Error updating agreement:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/agreements/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const deleted = await storage.deleteAgreement(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Agreement not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agreement:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/derramas", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const derramas = await storage.getDerramas(tenantId);
      res.json(derramas);
    } catch (error) {
      console.error("Error fetching derramas:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/derramas/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const derrama = await storage.getDerrama(req.params.id, tenantId);
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
      const tenantId = getTenantId(req);
      const data = insertDerramaSchema.parse({ ...req.body, tenantId });
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
      const tenantId = getTenantId(req);
      const derrama = await storage.updateDerrama(req.params.id, tenantId, req.body);
      if (!derrama) {
        return res.status(404).json({ error: "Derrama not found" });
      }
      res.json(derrama);
    } catch (error) {
      console.error("Error updating derrama:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/derramas/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const deleted = await storage.deleteDerrama(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Derrama not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting derrama:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/derramas/:id/payments", async (req: Request, res: Response) => {
    try {
      const payments = await storage.getDerramaPayments(req.params.id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching derrama payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/derramas/:id/payments", async (req: Request, res: Response) => {
    try {
      const data = insertDerramaPaymentSchema.parse({ 
        ...req.body, 
        derramaId: req.params.id 
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

  app.patch("/api/payments/:id", async (req: Request, res: Response) => {
    try {
      const payment = await storage.updateDerramaPayment(req.params.id, req.body);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/providers", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const providers = await storage.getProviders(tenantId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/providers/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const provider = await storage.getProvider(req.params.id, tenantId);
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
      const tenantId = getTenantId(req);
      const data = insertProviderSchema.parse({ ...req.body, tenantId });
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
      const tenantId = getTenantId(req);
      const provider = await storage.updateProvider(req.params.id, tenantId, req.body);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/providers/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const deleted = await storage.deleteProvider(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
