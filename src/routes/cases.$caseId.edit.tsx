import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { CaseForm } from '@/components/CaseForm';
import { getCaseById } from '@/lib/cases-repository';
import type { InvestigationCase } from '@/lib/types';

function toDateOnly(value?: string | null): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function toInvestigationCase(row: any): InvestigationCase {
  const createdAt = toDateOnly(row.created_at);
  const updatedAt = toDateOnly(row.updated_at) || createdAt;
  const daysElapsed = createdAt
    ? Math.max(0, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    id: row.id,
    ppe: row.ppe ?? '',
    physicalNumber: row.physical_number ?? '',
    priority: row.priority ?? 'Média',
    createdAt,
    deadline: toDateOnly(row.deadline),
    daysElapsed,
    crimeClassification: row.crime_classification ?? '',
    severity: row.severity ?? 'Outros',
    type: row.type ?? 'IP',
    victim: row.victim ?? '',
    suspect: row.suspect ?? '',
    team: row.team ?? '',
    officer: row.officer ?? '',
    location: row.location ?? '',
    district: row.district ?? '',
    motivation: row.motivation ?? '',
    diligenceStatus: row.diligence_status ?? 'Pendente',
    situation: row.situation ?? 'Instaurado',
    pendingActions: row.pending_actions ?? '',
    observations: row.observations ?? '',
    protectiveMeasure: row.protective_measure ?? false,
    processNumber: row.process_number ?? '',
    reportSent: row.report_sent ?? false,
    reportDate: toDateOnly(row.report_date),
    legalRepresentations: row.legal_representations ?? 0,
    updatedAt,
    updatedBy: row.updated_by ?? 'Sistema',
  };
}

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
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadCase = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const row = await getCaseById(caseId);
      if (!row) {
        setNotFound(true);
        setCaseData(null);
      } else {
        setCaseData(toInvestigationCase(row));
      }
    } catch (err: any) {
      if (err?.code === 'PGRST116') {
        setNotFound(true);
      } else {
        console.error('Erro ao carregar caso para edição:', err);
        setError('Não foi possível carregar o caso para edição.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  if (loading) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-muted-foreground">Carregando caso...</p>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-destructive">{error}</p>
          <button onClick={loadCase} className="mt-3 text-sm font-semibold text-primary hover:underline">Tentar novamente</button>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !caseData) {
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
