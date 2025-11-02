import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles, FileText, Users, BarChart3, Shield } from "lucide-react";
import heroImage from "@assets/generated_images/Modern_Spanish_community_building_92f3920f.png";
import aiAnalysisImage from "@assets/generated_images/AI_document_analysis_illustration_fe6beb33.png";
import dashboardImage from "@assets/generated_images/Community_management_dashboard_illustration_efc86c65.png";
import ticketingImage from "@assets/generated_images/Maintenance_ticketing_illustration_acd3f1b1.png";

export default function Landing() {
  const features = [
    {
      icon: Sparkles,
      title: "Análisis con IA",
      description: "Extracción automática de acuerdos de actas mediante inteligencia artificial",
      image: aiAnalysisImage,
    },
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Métricas y KPIs en tiempo real de tu comunidad",
      image: dashboardImage,
    },
    {
      icon: FileText,
      title: "Gestión Documental",
      description: "Organiza y busca documentos de forma eficiente",
      image: ticketingImage,
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Multi-tenant",
      description: "Gestiona múltiples comunidades desde una sola plataforma",
    },
    {
      icon: Shield,
      title: "Seguro",
      description: "Aislamiento total de datos por comunidad",
    },
    {
      icon: Building2,
      title: "Personalizable",
      description: "Branding y dominio personalizado para cada comunidad",
    },
  ];

  return (
    <div className="min-h-screen" data-testid="page-landing">
      <section
        className="relative h-[500px] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
        }}
      >
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-5xl font-bold mb-4">
            Administra Mi Comunidad
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Gestión inteligente de comunidades de vecinos con IA
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              data-testid="button-get-started"
            >
              Comenzar Ahora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/10 backdrop-blur-sm"
              data-testid="button-learn-more"
            >
              Saber Más
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Características Principales</h2>
          <p className="text-muted-foreground">
            Todo lo que necesitas para gestionar tu comunidad
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="overflow-hidden">
              <div className="h-48 overflow-hidden bg-muted">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Beneficios SaaS</h2>
            <p className="text-muted-foreground">
              Plataforma multi-tenant escalable y segura
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para transformar tu comunidad?
        </h2>
        <p className="text-muted-foreground mb-8">
          Únete a las comunidades que ya confían en nuestra plataforma
        </p>
        <Button size="lg" data-testid="button-cta">
          Solicitar Demo
        </Button>
      </section>
    </div>
  );
}
