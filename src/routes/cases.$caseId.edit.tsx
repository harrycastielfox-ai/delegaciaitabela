import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { CaseForm } from '@/components/CaseForm';
import { getCaseById } from '@/lib/case-store';

export const Route = createFileRoute('/cases/$caseId/edit')({
  component: CaseEditPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Editar Inquérito' },
      { name: 'description', content: 'Editar inquérito policial' },
    ],
  }),
});

function CaseEditPage() {
  const { caseId } = Route.useParams();
  const caseData = getCaseById(caseId);
  if (!caseData) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-muted-foreground">Caso não encontrado.</p>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <CaseForm initialData={caseData} mode="edit" />
    </AppLayout>
  );
}
