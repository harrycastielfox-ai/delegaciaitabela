import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { DashboardView } from '@/components/DashboardView';

export const Route = createFileRoute('/')({
  component: IndexPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Dashboard' },
      { name: 'description', content: 'Sistema de Inquéritos Policiais - Painel de Controle' },
    ],
  }),
});

function IndexPage() {
  return (
    <AppLayout>
      <DashboardView />
    </AppLayout>
  );
}
