import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { CaseDetailsView } from '@/components/CaseDetailsView';

export const Route = createFileRoute('/cases/$caseId/')({
  component: CaseDetailPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Detalhes do Inquérito' },
      { name: 'description', content: 'Detalhes do inquérito policial' },
    ],
  }),
});

function CaseDetailPage() {
  const { caseId } = Route.useParams();
  return (
    <AppLayout>
      <CaseDetailsView caseId={caseId} />
    </AppLayout>
  );
}
