import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommunitySelector } from "@/components/community-selector";
import { useUser } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Comunidades from "@/pages/comunidades";
import Incidencias from "@/pages/incidencias";
import Documentos from "@/pages/documentos";
import Acuerdos from "@/pages/acuerdos";
import Derramas from "@/pages/derramas";
import Proveedores from "@/pages/proveedores";
import Configuracion from "@/pages/configuracion";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();

  // Redirect to login if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-3 border-b gap-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <CommunitySelector />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/landing" component={Landing} />
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/comunidades">
        <AppLayout>
          <Comunidades />
        </AppLayout>
      </Route>
      <Route path="/incidencias">
        <AppLayout>
          <Incidencias />
        </AppLayout>
      </Route>
      <Route path="/documentos">
        <AppLayout>
          <Documentos />
        </AppLayout>
      </Route>
      <Route path="/acuerdos">
        <AppLayout>
          <Acuerdos />
        </AppLayout>
      </Route>
      <Route path="/derramas">
        <AppLayout>
          <Derramas />
        </AppLayout>
      </Route>
      <Route path="/proveedores">
        <AppLayout>
          <Proveedores />
        </AppLayout>
      </Route>
      <Route path="/configuracion">
        <AppLayout>
          <Configuracion />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
