import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { RepresentationsView } from '@/components/RepresentationsView';

export const Route = createFileRoute('/representacoes/')({
  component: RepresentacoesPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Representações Judiciais' },
      { name: 'description', content: 'Gestão de representações judiciais' },
    ],
  }),
});

function RepresentacoesPage() {
  return (
    <AppLayout fluid>
      <RepresentationsView />
    </AppLayout>
  );
}
