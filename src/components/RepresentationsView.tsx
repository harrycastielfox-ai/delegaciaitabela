import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Eye, Gavel, PlusCircle, RefreshCw } from 'lucide-react';
import { getRepresentationDashboardStats, listRepresentations } from '@/lib/representations-repository';
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

const STATUS_CLASS: Record<string, string> = {
  em_analise: 'bg-primary/15 text-primary border border-primary/30',
  aguardando_analise_judicial: 'bg-warning/15 text-warning border border-warning/30',
  deferida: 'bg-success/15 text-success border border-success/30',
  indeferida: 'bg-destructive/15 text-destructive border border-destructive/30',
  cumprida_parcial: 'bg-chart-5/15 text-chart-5 border border-chart-5/30',
  cumprida_total: 'bg-success/15 text-success border border-success/30',
  arquivada: 'bg-muted/40 text-muted-foreground border border-border',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  const cls = STATUS_CLASS[status] ?? 'bg-muted text-muted-foreground border border-border';
  return <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${cls}`}>{label}</span>;
}

export function RepresentationsView() {
  const [items, setItems] = useState<JudicialRepresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    deferimentoRate: 0,
    totalCumpridas: 0,
    totalIndeferidas: 0,
    byType: [] as Array<{ type: string; total: number; deferidas: number; cumpridas: number; successRate: number }>,
    byStatus: [] as Array<{ status: string; total: number }>,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [list, dashboard] = await Promise.all([listRepresentations(), getRepresentationDashboardStats()]);
      setItems(list);
      setStats(dashboard);
    } catch (err) {
      console.error('Erro ao carregar representações:', err);
      setError('Não foi possível carregar os dados de representações judiciais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const recent = useMemo(() => items.slice(0, 10), [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Gavel className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Representações Judiciais</h1>
          </div>
          <p className="text-sm text-muted-foreground">Módulo independente de medidas judiciais vinculadas a PPE</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <Link to="/representacoes/nova" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> Nova Representação
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="section-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total</p>
          <p className="mt-2 text-3xl font-extrabold text-primary">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Representações</p>
        </div>
        <div className="section-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Deferimento</p>
          <p className="mt-2 text-3xl font-extrabold text-success">{stats.deferimentoRate}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Taxa geral</p>
        </div>
        <div className="section-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Cumpridas</p>
          <p className="mt-2 text-3xl font-extrabold text-success">{stats.totalCumpridas}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total cumpridas</p>
        </div>
        <div className="section-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Indeferidas</p>
          <p className="mt-2 text-3xl font-extrabold text-destructive">{stats.totalIndeferidas}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total indeferidas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="section-card xl:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-primary">Por tipo de representação</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Deferidas</th>
                  <th className="px-2 py-2">Cumpridas</th>
                  <th className="px-2 py-2">% Sucesso</th>
                </tr>
              </thead>
              <tbody>
                {stats.byType.map((item) => (
                  <tr key={item.type} className="border-b border-border/40 last:border-0">
                    <td className="px-2 py-2 text-xs font-medium text-foreground">{item.type}</td>
                    <td className="px-2 py-2 text-xs">{item.total}</td>
                    <td className="px-2 py-2 text-xs text-success">{item.deferidas}</td>
                    <td className="px-2 py-2 text-xs text-primary">{item.cumpridas}</td>
                    <td className="px-2 py-2 text-xs font-semibold text-success">{item.successRate}%</td>
                  </tr>
                ))}
                {!loading && stats.byType.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-8 text-center text-xs text-muted-foreground">Sem dados por tipo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-warning">Status geral</h2>
          <div className="space-y-2">
            {stats.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-md border border-border/70 bg-background/40 px-3 py-2">
                <span className="text-xs text-foreground">{STATUS_LABEL[item.status] ?? item.status}</span>
                <span className="text-sm font-bold text-primary">{item.total}</span>
              </div>
            ))}
            {!loading && stats.byStatus.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem dados de status.</p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Representações recentes</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">PPE vinculado</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Vítima</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Investigado/Alvo</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Processo judicial</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((item) => (
              <tr key={item.id} className="data-table-row">
                <td className="px-4 py-3 font-mono text-[11px] font-semibold text-primary">{item.ppeLinked}</td>
                <td className="px-4 py-3 text-xs">{item.victim || '—'}</td>
                <td className="px-4 py-3 text-xs">{item.targetName || '—'}</td>
                <td className="px-4 py-3 text-xs">{item.representationType}</td>
                <td className="px-4 py-3 text-xs">{item.judicialProcessNumber || '—'}</td>
                <td className="px-4 py-3 text-xs">{formatDate(item.representationDate)}</td>
                <td className="px-4 py-3 text-xs"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/representacoes/$representationId"
                      params={{ representationId: item.id }}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/20"
                    >
                      <Eye className="h-3 w-3" /> Abrir
                    </Link>
                    <Link
                      to="/representacoes/$representationId/editar"
                      params={{ representationId: item.id }}
                      className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-[10px] font-semibold text-foreground hover:bg-muted"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && recent.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">Nenhuma representação cadastrada.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">Carregando representações...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
