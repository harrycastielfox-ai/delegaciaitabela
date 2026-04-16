import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { CaseListView } from '@/components/CaseListView';

export const Route = createFileRoute('/cases/')({
  component: CasesPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Inquéritos' },
      { name: 'description', content: 'Lista de inquéritos policiais' },
    ],
  }),
});

function CasesPage() {
  return (
    <AppLayout>
      <CaseListView />
    </AppLayout>
  );
}
