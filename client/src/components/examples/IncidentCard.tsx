import { IncidentCard } from '../incident-card';

export default function IncidentCardExample() {
  return (
    <div className="p-8 max-w-md">
      <IncidentCard
        id="1"
        title="Fuga de agua en el portal"
        status="en_curso"
        priority="alta"
        category="Fontanería"
        reporter="María García"
        date="hace 2 horas"
        onClick={() => console.log('Incident clicked')}
      />
    </div>
  );
}
