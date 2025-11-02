import { db } from "./db";
import { tenants, users, incidents, documents, agreements, derramas, derramaPayments, providers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, 'demo')).limit(1);
  const tenantId = tenant.id;

  console.log(`Found tenant: ${tenantId}`);

  const sampleUsers = [
    {
      tenantId,
      username: "maria.garcia",
      email: "maria@example.com",
      password: "hashed_password",
      fullName: "María García",
      role: "user" as const,
    },
    {
      tenantId,
      username: "juan.perez",
      email: "juan@example.com",
      password: "hashed_password",
      fullName: "Juan Pérez",
      role: "admin" as const,
    },
    {
      tenantId,
      username: "ana.lopez",
      email: "ana@example.com",
      password: "hashed_password",
      fullName: "Ana López",
      role: "user" as const,
    },
  ];

  console.log("Creating users...");
  const createdUsers = await db.insert(users).values(sampleUsers).returning().onConflictDoNothing();
  const [user1, user2, user3] = createdUsers.length > 0 ? createdUsers : await db.select().from(users).where(eq(users.tenantId, tenantId)).limit(3);

  const sampleIncidents = [
    {
      tenantId,
      title: "Fuga de agua en el portal principal",
      description: "Se ha detectado una fuga importante de agua en la entrada del edificio",
      status: "en_curso" as const,
      priority: "alta" as const,
      category: "Fontanería",
      location: "Portal principal",
      reportedBy: user1?.id,
    },
    {
      tenantId,
      title: "Luz fundida en escalera 3ª planta",
      description: "La bombilla de la escalera de la tercera planta no funciona",
      status: "pendiente" as const,
      priority: "media" as const,
      category: "Electricidad",
      location: "Escalera 3ª planta",
      reportedBy: user2?.id,
    },
    {
      tenantId,
      title: "Ruidos en ascensor B",
      description: "El ascensor B hace ruidos extraños al subir",
      status: "pendiente" as const,
      priority: "baja" as const,
      category: "Mantenimiento",
      location: "Ascensor B",
      reportedBy: user3?.id,
    },
    {
      tenantId,
      title: "Puerta del garaje no cierra bien",
      description: "La puerta automática del garaje no cierra completamente",
      status: "resuelto" as const,
      priority: "media" as const,
      category: "Mantenimiento",
      location: "Garaje",
      reportedBy: user1?.id,
      resolvedAt: new Date(),
    },
  ];

  console.log("Creating incidents...");
  await db.insert(incidents).values(sampleIncidents).onConflictDoNothing();

  const sampleDocuments = [
    {
      tenantId,
      title: "Acta Junta Enero 2025",
      description: "Acta de la junta ordinaria de enero",
      type: "acta",
      fileUrl: "/documents/acta-enero-2025.pdf",
      fileSize: 245678,
      uploadedBy: user2?.id,
      isAnalyzed: true,
      analysisResult: "Se acordó la reparación de la fachada y la renovación del ascensor",
    },
    {
      tenantId,
      title: "Presupuesto Reparación Fachada",
      description: "Presupuesto para la reparación de la fachada sur",
      type: "presupuesto",
      fileUrl: "/documents/presupuesto-fachada.pdf",
      fileSize: 123456,
      uploadedBy: user2?.id,
    },
    {
      tenantId,
      title: "Certificado ITE 2024",
      description: "Certificado de inspección técnica del edificio",
      type: "certificado",
      fileUrl: "/documents/ite-2024.pdf",
      fileSize: 567890,
      uploadedBy: user2?.id,
    },
  ];

  console.log("Creating documents...");
  const createdDocs = await db.insert(documents).values(sampleDocuments).returning().onConflictDoNothing();
  const [doc1] = createdDocs.length > 0 ? createdDocs : await db.select().from(documents).where(eq(documents.tenantId, tenantId)).limit(1);

  const sampleAgreements = [
    {
      tenantId,
      documentId: doc1?.id,
      title: "Reparación de fachada sur",
      description: "Aprobar presupuesto y comenzar obras en primavera",
      responsible: "Juan Pérez",
      deadline: new Date("2025-04-01"),
      status: "pendiente" as const,
    },
    {
      tenantId,
      documentId: doc1?.id,
      title: "Renovación ascensor principal",
      description: "Contratar empresa para renovación completa del ascensor",
      responsible: "María García",
      deadline: new Date("2025-06-01"),
      status: "pendiente" as const,
    },
  ];

  console.log("Creating agreements...");
  await db.insert(agreements).values(sampleAgreements).onConflictDoNothing();

  const sampleDerramas = [
    {
      tenantId,
      title: "Reparación Fachada 2025",
      description: "Derrama extraordinaria para reparación de fachada sur",
      totalAmount: "15000.00",
      collectedAmount: "9500.00",
      dueDate: new Date("2025-03-31"),
    },
    {
      tenantId,
      title: "Renovación Ascensor",
      description: "Derrama para renovación del ascensor principal",
      totalAmount: "12000.00",
      collectedAmount: "3200.00",
      dueDate: new Date("2025-05-31"),
    },
  ];

  console.log("Creating derramas...");
  const createdDerramas = await db.insert(derramas).values(sampleDerramas).returning().onConflictDoNothing();
  const [derrama1] = createdDerramas.length > 0 ? createdDerramas : await db.select().from(derramas).where(eq(derramas.tenantId, tenantId)).limit(1);

  if (derrama1 && user1 && user2 && user3) {
    const samplePayments = [
      {
        derramaId: derrama1.id,
        userId: user1.id,
        amount: "500.00",
        isPaid: true,
        paidAt: new Date(),
      },
      {
        derramaId: derrama1.id,
        userId: user2.id,
        amount: "500.00",
        isPaid: false,
      },
    ];

    console.log("Creating derrama payments...");
    await db.insert(derramaPayments).values(samplePayments).onConflictDoNothing();
  }

  const sampleProviders = [
    {
      tenantId,
      name: "Fontanería Rápida SL",
      category: "Fontanería",
      phone: "+34 912 345 678",
      email: "info@fontaneriapida.com",
      rating: "4.5",
      servicesCount: 12,
    },
    {
      tenantId,
      name: "Electricistas Madrid",
      category: "Electricidad",
      phone: "+34 913 456 789",
      email: "contacto@electricistasmadrid.com",
      rating: "4.8",
      servicesCount: 8,
    },
    {
      tenantId,
      name: "Mantenimiento Integral",
      category: "Mantenimiento",
      phone: "+34 914 567 890",
      email: "info@mantenimientointegral.com",
      rating: "4.2",
      servicesCount: 15,
    },
  ];

  console.log("Creating providers...");
  await db.insert(providers).values(sampleProviders).onConflictDoNothing();

  console.log("✅ Seeding complete!");
}

seed()
  .then(() => {
    console.log("Database seeded successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
