import { DerramaCard } from '../derrama-card';

export default function DerramaCardExample() {
  return (
    <div className="p-8 max-w-md">
      <DerramaCard
        id="1"
        title="Reparación fachada principal"
        amount={15000}
        collected={12000}
        membersTotal={30}
        membersPaid={24}
        dueDate="15 Mar 2025"
      />
    </div>
  );
}
