import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { RepresentationForm } from '@/components/RepresentationForm';
import { getRepresentationById } from '@/lib/representations-repository';
import type { JudicialRepresentation } from '@/lib/representations-types';

export const Route = createFileRoute('/representacoes/$representationId/editar')({
  component: EditarRepresentacaoPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Editar Representação' },
      { name: 'description', content: 'Edição de representação judicial' },
    ],
  }),
});

function EditarRepresentacaoPage() {
  const { representationId } = Route.useParams();
  const [representation, setRepresentation] = useState<JudicialRepresentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepresentation = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRepresentationById(representationId);
        setRepresentation(data);
      } catch (err) {
        console.error('Erro ao carregar representação para edição:', err);
        setError('Não foi possível carregar a representação para edição.');
      } finally {
        setLoading(false);
      }
    };

    loadRepresentation();
  }, [representationId]);

  if (loading) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-muted-foreground">Carregando representação...</p>
      </AppLayout>
    );
  }

  if (error || !representation) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-destructive">{error || 'Representação não encontrada.'}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <RepresentationForm mode="edit" initialData={representation} />
    </AppLayout>
  );
}
