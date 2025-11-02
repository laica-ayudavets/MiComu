import { AgreementCard } from '../agreement-card';

export default function AgreementCardExample() {
  return (
    <div className="p-8 max-w-md">
      <AgreementCard
        id="1"
        title="Instalar cámaras de seguridad en el portal"
        responsible="SeguridadTotal S.L."
        deadline="1 Sep 2025"
        status="pendiente"
        onToggleStatus={() => console.log('Toggle status clicked')}
      />
    </div>
  );
}
