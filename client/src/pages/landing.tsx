import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles, FileText, Users, BarChart3, Shield, ArrowRight } from "lucide-react";
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
      gradient: "from-primary/20 to-accent/20",
    },
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Métricas y KPIs en tiempo real de tu comunidad",
      image: dashboardImage,
      gradient: "from-accent/20 to-primary/20",
    },
    {
      icon: FileText,
      title: "Gestión Documental",
      description: "Organiza y busca documentos de forma eficiente",
      image: ticketingImage,
      gradient: "from-primary/20 via-accent/10 to-primary/20",
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Multi-tenant",
      description: "Gestiona múltiples comunidades desde una sola plataforma",
      iconBg: "bg-gradient-to-br from-primary to-primary/70",
    },
    {
      icon: Shield,
      title: "Seguro",
      description: "Aislamiento total de datos por comunidad",
      iconBg: "bg-gradient-to-br from-accent to-accent/70",
    },
    {
      icon: Building2,
      title: "Personalizable",
      description: "Branding y dominio personalizado para cada comunidad",
      iconBg: "bg-gradient-to-br from-primary via-accent/50 to-primary",
    },
  ];

  return (
    <div className="min-h-screen" data-testid="page-landing">
      <section
        className="relative min-h-[600px] flex items-center justify-center bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        
        <div className="relative text-center text-white px-4 max-w-5xl z-10">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <span className="text-sm font-medium">✨ Impulsado por Inteligencia Artificial</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/90">
            Administra Mi Comunidad
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/95 max-w-3xl mx-auto">
            La plataforma definitiva para gestión inteligente de comunidades de vecinos
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all"
              data-testid="button-get-started"
            >
              Comenzar Ahora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-2 border-white/40 hover:bg-white/10 backdrop-blur-md shadow-lg"
              data-testid="button-learn-more"
            >
              Saber Más
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Características
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            Todo lo que necesitas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas potentes para gestionar tu comunidad de forma eficiente
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-elevate group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`h-48 overflow-hidden bg-gradient-to-br ${feature.gradient} relative`}>
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-60" />
              </div>
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium">
              SaaS Multi-tenant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Beneficios Empresariales</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diseñado para escalar con tu negocio
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title}
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover-elevate"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-8">
                  <div className={`w-16 h-16 rounded-2xl ${benefit.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 max-w-5xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl blur-3xl -z-10" />
        <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-12 shadow-xl border">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para transformar tu comunidad?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Únete a las comunidades que ya confían en nuestra plataforma para gestionar su día a día
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all px-8"
            data-testid="button-cta"
          >
            Solicitar Demo Gratuita
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
