import { ProviderCard } from '../provider-card';

export default function ProviderCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ProviderCard
        id="1"
        name="Fontaneros 24h"
        category="Fontanería"
        email="servicios@fontaneros24h.es"
        phone="+34 600 123 456"
        rating={4.5}
        servicesCount={12}
        onContact={() => console.log('Contact clicked')}
      />
    </div>
  );
}
