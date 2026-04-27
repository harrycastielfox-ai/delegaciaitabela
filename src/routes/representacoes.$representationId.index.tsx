import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { RepresentationDetailsView } from '@/components/RepresentationDetailsView';

export const Route = createFileRoute('/representacoes/$representationId/')({
  component: RepresentationDetailsPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Detalhes da Representação' },
      { name: 'description', content: 'Detalhes da representação judicial' },
    ],
  }),
});

function RepresentationDetailsPage() {
  const { representationId } = Route.useParams();

  return (
    <AppLayout>
      <RepresentationDetailsView representationId={representationId} />
    </AppLayout>
  );
}
