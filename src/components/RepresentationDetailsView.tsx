import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { deleteRepresentation, getRepresentationById } from '@/lib/representations-repository';
import type { JudicialRepresentation } from '@/lib/representations-types';

const STATUS_LABEL: Record<string, string> = {
  em_analise: 'Em análise',
  aguardando_analise_judicial: 'Aguardando análise judicial',
  deferida: 'Deferida',
  indeferida: 'Indeferida',
  cumprida_parcial: 'Cumprida parcial',
  cumprida_total: 'Cumprida total',
  arquivada: 'Arquivada',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function triLabel(value?: string) {
  if (value === 'sim') return 'Sim';
  if (value === 'nao') return 'Não';
  if (value === 'parcial') return 'Parcial';
  return '—';
}

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section-card space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-primary">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function RepresentationDetailsView({ representationId }: { representationId: string }) {
  const navigate = useNavigate();
  const [item, setItem] = useState<JudicialRepresentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRepresentationById(representationId);
      setItem(data);
    } catch (err) {
      console.error('Erro ao carregar representação:', err);
      setError('Não foi possível carregar a representação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
  }, [representationId]);

  const handleDelete = async () => {
    if (!item) return;
    const confirmDelete = window.confirm('Deseja realmente excluir esta representação?');
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteRepresentation(item.id);
      navigate({ to: '/representacoes' });
    } catch (err) {
      console.error('Erro ao excluir representação:', err);
      setError('Não foi possível excluir a representação.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Carregando representação...</p>;
  }

  if (error || !item) {
    return (
      <div className="py-20 text-center">
        <p className="text-destructive">{error || 'Representação não encontrada.'}</p>
        <button onClick={loadItem} className="mt-3 text-sm font-semibold text-primary hover:underline">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Link to="/representacoes" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para representações
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Detalhes da Representação</h1>
          <p className="text-sm text-muted-foreground">Status: {STATUS_LABEL[item.status] ?? item.status}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/representacoes/$representationId/editar" params={{ representationId: item.id }} className="btn-secondary">
            <Pencil className="h-4 w-4" /> Editar
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-secondary text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>

      <Block title="Informações Gerais">
        <Field label="ID" value={item.id} />
        <Field label="Nº PPE vinculado" value={item.ppeLinked} />
        <Field label="Tipo de Representação" value={item.representationType} />
        <Field label="Processo Judicial" value={item.judicialProcessNumber} />
        <Field label="Vara/Juízo" value={item.courtBranch} />
        <Field label="Data da Representação" value={formatDate(item.representationDate)} />
      </Block>

      <Block title="Pessoas">
        <Field label="Vítima" value={item.victim} />
        <Field label="Investigado/Alvo" value={item.targetName} />
      </Block>

      <Block title="Andamento Judicial">
        <Field label="Deferida?" value={triLabel(item.deferimentoStatus)} />
        <Field label="Data deferimento" value={formatDate(item.deferimentoDate)} />
        <Field label="Prazo concedido" value={item.grantedDeadlineDays ? `${item.grantedDeadlineDays} dia(s)` : '—'} />
        <Field label="Data vencimento" value={formatDate(item.dueDate)} />
      </Block>

      <Block title="Cumprimento">
        <Field label="Cumprida?" value={triLabel(item.complianceStatus)} />
        <Field label="Data cumprimento" value={formatDate(item.complianceDate)} />
        <Field label="Equipe responsável" value={item.responsibleTeam} />
      </Block>

      <Block title="Resultado">
        <Field label="Resultado da diligência" value={item.diligenceResult} />
        <Field label="Observações" value={item.notes} />
        <Field label="Status" value={STATUS_LABEL[item.status] ?? item.status} />
      </Block>
    </div>
  );
}
