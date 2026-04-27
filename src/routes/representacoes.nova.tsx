import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { RepresentationForm } from '@/components/RepresentationForm';

export const Route = createFileRoute('/representacoes/nova')({
  component: NovaRepresentacaoPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Nova Representação' },
      { name: 'description', content: 'Cadastro de nova representação judicial' },
    ],
  }),
});

function NovaRepresentacaoPage() {
  return (
    <AppLayout>
      <RepresentationForm mode="create" />
    </AppLayout>
  );
}
