import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Building2, Palette } from "lucide-react";

export default function Configuracion() {
  const [communityName, setCommunityName] = useState("Comunidad Los Pinos");
  const [address, setAddress] = useState("Calle Olmo 45, Madrid");
  const [primaryColor, setPrimaryColor] = useState("#1565c0");

  return (
    <div className="p-6 space-y-6" data-testid="page-configuracion">
      <div>
        <h1 className="text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Personaliza tu comunidad
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-general">
            <Building2 className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" data-testid="tab-branding">
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Comunidad</CardTitle>
              <CardDescription>
                Información básica de la comunidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="community-name">Nombre de la Comunidad</Label>
                <Input
                  id="community-name"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  data-testid="input-community-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  data-testid="input-address"
                />
              </div>
              <Button data-testid="button-save-general">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalización Visual</CardTitle>
              <CardDescription>
                Personaliza los colores y logotipo de tu comunidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Color Primario</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10"
                    data-testid="input-primary-color"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#1565c0"
                    data-testid="input-primary-color-hex"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logotipo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  data-testid="input-logo"
                />
                <p className="text-xs text-muted-foreground">
                  Formato recomendado: PNG o SVG, tamaño máximo 2MB
                </p>
              </div>
              <Button data-testid="button-save-branding">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
