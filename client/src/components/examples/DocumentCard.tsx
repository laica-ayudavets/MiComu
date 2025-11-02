import { DocumentCard } from '../document-card';

export default function DocumentCardExample() {
  return (
    <div className="p-8 max-w-md">
      <DocumentCard
        id="1"
        title="Acta Ordinaria Enero 2025"
        type="acta"
        date="15 Ene 2025"
        hasAIAnalysis={true}
        agreementsCount={3}
        onView={() => console.log('View clicked')}
        onDownload={() => console.log('Download clicked')}
        onAnalyze={() => console.log('Analyze clicked')}
      />
    </div>
  );
}
