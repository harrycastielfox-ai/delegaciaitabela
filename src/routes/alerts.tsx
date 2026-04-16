import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { AlertsView } from '@/components/AlertsView';

export const Route = createFileRoute('/alerts')({
  component: AlertsPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Alertas' },
      { name: 'description', content: 'Alertas de inquéritos policiais' },
    ],
  }),
});

function AlertsPage() {
  return (
    <AppLayout>
      <AlertsView />
    </AppLayout>
  );
}
