import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Expand,
  FileText,
  Gavel,
  Info,
  Maximize2,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  isCaseNoDeadline,
  isCaseNoRecentUpdate,
  isCaseOverdue,
  isFinalizedSituation,
  listCases,
} from '@/lib/cases-repository';
import type { InvestigationCase } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Panel } from '@/components/dashboard/Panel';
import { StatCard } from '@/components/dashboard/StatCard';

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const CHART_COLORS = ['#12d681', '#21a5ff', '#facc15', '#f87171', '#a78bfa', '#f59e0b'];

const STATUS_COLORS: Record<string, string> = {
  'Em andamento': '#3ddc84',
  Instaurado: '#2dd4bf',
  Relatado: '#1da1f2',
  Remetido: '#f59e0b',
  Arquivado: '#facc15',
  Finalizados: '#12d681',
  Outros: '#a78bfa',
};

const SEVERITY_COLORS: Record<string, string> = {
  CVLI: '#ff4d4f',
  CVP: '#facc15',
  Patrimonial: '#21a5ff',
  Drogas: '#a78bfa',
  Outros: '#34d399',
};

const SEVERITY_ORDER = ['CVLI', 'CVP', 'Patrimonial'];

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  fontSize: '11px',
  color: 'var(--foreground)',
  boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
};

function EmptyState({
  icon: Icon,
  title,
  description = 'Nenhum dado disponível ainda',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-full min-h-[170px] flex-col items-center justify-center rounded-xl border border-border bg-background/35 px-4 text-center">
      <Icon className="mb-3 h-5 w-5 text-primary/80" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function formatRelativeTime(date: string | undefined) {
  if (!date) return 'Agora';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Agora';

  const diffMs = Date.now() - parsed.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMins < 60) return `Há ${diffMins || 1} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}

function getAlertBadgeClass(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'border-red-400/35 bg-red-500/10 text-red-300';
  if (severity === 'medium') return 'border-amber-400/35 bg-amber-500/10 text-amber-300';
  return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300';
}

function getAlertLabel(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'ALTO';
  if (severity === 'medium') return 'MÉDIO';
  return 'BAIXO';
}

function LegendItem({ color, label, line = false }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {line ? (
        <span className="h-0.5 w-4" style={{ backgroundColor: color }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  );
}

function DonutPanel({
  title,
  data,
  total,
  accent = 'success',
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  total: number;
  accent?: 'success' | 'info' | 'warning' | 'destructive' | 'purple';
}) {
  return (
    <Panel
      title={title}
      accent={accent}
      action={<Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />}
      className="h-full"
    >
      {data.length === 0 ? (
        <EmptyState icon={Activity} title="Nenhum dado disponível ainda" />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-40 w-40 shrink-0 self-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={74}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black tabular-nums text-foreground">{total}</span>
              <span className="text-[10px] text-muted-foreground">Total</span>
            </div>
          </div>

          <ul className="flex-1 space-y-2.5 text-sm">
            {data.map((d) => {
              const pct = total ? Math.round((d.value / total) * 100) : 0;

              return (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 truncate text-xs text-foreground/90">{d.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {d.value} ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function BarList({
  items,
  emptyIcon: Icon,
  emptyTitle,
}: {
  items: { name: string; count: number; percentage: number }[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
}) {
  if (items.length === 0) {
    return <EmptyState icon={Icon} title={emptyTitle} />;
  }

  return (
    <ul className="space-y-3.5">
      {items.slice(0, 6).map((item) => (
        <li key={item.name} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground/85">{item.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.count} ({item.percentage}%)
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success" style={{ width: `${item.percentage}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadCases = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listCases();
      setCases(data);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const stats = useMemo(() => {
    const total = cases.length;
    const inProgress = cases.filter((c) => c.situation === 'Em andamento').length;
    const closed = cases.filter((c) => isFinalizedSituation(c.situation)).length;
    const highPriority = cases.filter((c) => c.priority === 'Alta').length;
    const overdue = cases.filter((c) => isCaseOverdue(c)).length;
    const noDeadline = cases.filter((c) => isCaseNoDeadline(c)).length;
    const noRecentUpdate = cases.filter((c) => isCaseNoRecentUpdate(c)).length;
    const defendantArrested = cases.filter((c) => c.defendantArrested).length;
    const protectiveMeasures = cases.filter((c) => c.protectiveMeasure).length;

    return {
      total,
      inProgress,
      closed,
      highPriority,
      overdue,
      noDeadline,
      noRecentUpdate,
      defendantArrested,
      protectiveMeasures,
    };
  }, [cases]);

  const chartByStatus = useMemo(() => {
    const finalized = cases.filter((c) => isFinalizedSituation(c.situation)).length;
    const inProgress = cases.filter((c) => c.situation === 'Em andamento').length;
    const others = Math.max(cases.length - finalized - inProgress, 0);

    return [
      { name: 'Em andamento', value: inProgress },
      { name: 'Finalizados', value: finalized },
      { name: 'Outros', value: others },
    ].filter((item) => item.value > 0);
  }, [cases]);

  const chartByTeam = useMemo(() => {
    const map: Record<string, number> = {};

    cases.forEach((c) => {
      const team = (c.team || 'Sem equipe').split(' - ')[0];
      map[team] = (map[team] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percentage: stats.total ? Math.round((count / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases, stats.total]);

  const chartBySeverity = useMemo(() => {
    const map = { CVLI: 0, CVP: 0, Patrimonial: 0 };

    cases.forEach((c) => {
      if (c.severity === 'CVLI' || c.severity === 'CVP' || c.severity === 'Patrimonial') {
        map[c.severity] += 1;
      }
    });

    return SEVERITY_ORDER.map((name) => ({ name, value: map[name as keyof typeof map] })).filter(
      (item) => item.value > 0,
    );
  }, [cases]);

  const procedureByType = useMemo(() => {
    const map: Record<string, number> = {};

    cases.forEach((c) => {
      const type = c.type || 'Não informado';
      map[type] = (map[type] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        count: value,
        percentage: stats.total ? Math.round((value / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases, stats.total]);

  const pendingByCategory = useMemo(() => {
    const rows = [
      {
        label: 'Prazos vencidos',
        value: stats.overdue,
        tone: 'destructive' as const,
      },
      {
        label: 'Sem atualização há mais de 15 dias',
        value: stats.noRecentUpdate,
        tone: 'warning' as const,
      },
      {
        label: 'Sem data limite definida',
        value: stats.noDeadline,
        tone: 'purple' as const,
      },
      {
        label: 'Prioridade alta',
        value: stats.highPriority,
        tone: 'info' as const,
      },
    ];

    return rows.filter((row) => row.value > 0);
  }, [stats]);

  const cvliElucidationData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, index) => currentYear - (5 - index));

    const byYear = years.reduce<
      Record<number, { key: string; ano: number; registros: number; elucidados: number; percentual: number }>
    >((acc, year) => {
      acc[year] = {
        key: String(year),
        ano: year,
        registros: 0,
        elucidados: 0,
        percentual: 0,
      };

      return acc;
    }, {});

    cases.forEach((c) => {
      const isCvli = c.severity === 'CVLI' || c.crimeClassification === 'CVLI';

      if ((c.type === 'IP' || c.type === 'APF') && isCvli && c.createdAt) {
        const createdAt = new Date(c.createdAt);

        if (!Number.isNaN(createdAt.getTime())) {
          const year = createdAt.getFullYear();
          if (byYear[year]) byYear[year].registros += 1;
        }
      }

      if (isCvli && c.situation === 'Relatado' && c.reportSent && c.reportDate) {
        const reportDate = new Date(c.reportDate);

        if (!Number.isNaN(reportDate.getTime())) {
          const year = reportDate.getFullYear();
          if (byYear[year]) byYear[year].elucidados += 1;
        }
      }
    });

    return years.map((year) => {
      const item = byYear[year];
      const percentual = item.registros === 0 ? 0 : Number(((item.elucidados / item.registros) * 100).toFixed(1));

      return { ...item, percentual };
    });
  }, [cases]);

  const criticalCases = useMemo(() => {
    return cases
      .filter((c) => {
        if (isFinalizedSituation(c.situation)) return false;
        return isCaseOverdue(c) || (c.priority === 'Alta' && c.severity === 'CVLI');
      })
      .slice(0, 5);
  }, [cases]);

  const topAlerts = useMemo(() => {
    const alerts = cases.flatMap((c) => {
      const caseAlerts = [] as Array<{
        id: string;
        caseId: string;
        casePpe: string;
        message: string;
        severity: 'high' | 'medium' | 'low';
        time: string;
      }>;

      if (isCaseOverdue(c)) {
        caseAlerts.push({
          id: `overdue-${c.id}`,
          caseId: c.id,
          casePpe: c.ppe,
          message: 'Prazo vencido',
          severity: 'high',
          time: formatRelativeTime(c.updatedAt),
        });
      }

      if (isCaseNoDeadline(c)) {
        caseAlerts.push({
          id: `no-deadline-${c.id}`,
          caseId: c.id,
          casePpe: c.ppe,
          message: 'Sem prazo definido',
          severity: 'low',
          time: formatRelativeTime(c.updatedAt),
        });
      }

      if (isCaseNoRecentUpdate(c)) {
        caseAlerts.push({
          id: `no-update-${c.id}`,
          caseId: c.id,
          casePpe: c.ppe,
          message: 'Sem atualização há mais de 15 dias',
          severity: 'medium',
          time: formatRelativeTime(c.updatedAt),
        });
      }

      return caseAlerts;
    });

    const rank = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 6);
  }, [cases]);

  const cvliTotals = useMemo(() => {
    return cvliElucidationData.reduce(
      (acc, item) => {
        acc.registros += item.registros;
        acc.elucidados += item.elucidados;
        return acc;
      },
      { registros: 0, elucidados: 0 },
    );
  }, [cvliElucidationData]);

  const resolutionRate = stats.total === 0 ? 0 : Math.round((stats.closed / stats.total) * 100);

  const refreshLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '---';

  const totalByStatus = chartByStatus.reduce((acc, item) => acc + item.value, 0);
  const totalBySeverity = chartBySeverity.reduce((acc, item) => acc + item.value, 0);

  const statusDonutData = chartByStatus.map((item, index) => ({
    ...item,
    color: STATUS_COLORS[item.name] || CHART_COLORS[index % CHART_COLORS.length],
  }));

  const severityDonutData = chartBySeverity.map((item, index) => ({
    ...item,
    color: SEVERITY_COLORS[item.name] || CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="w-full max-w-none space-y-4 rounded-2xl bg-background/80 px-1 py-1 md:space-y-5 md:px-2 md:py-2">
      <PageHeader
        title="Painel de Controle"
        subtitle="Visão operacional dos inquéritos policiais"
        updatedAt={refreshLabel}
        loading={loading}
        onRefresh={loadCases}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <motion.div {...anim()}>
          <StatCard label="Total" value={stats.total} hint="Inquéritos cadastrados" icon={FileText} tone="success" />
        </motion.div>

        <motion.div {...anim(0.03)}>
          <Link to="/cases" search={{ situation: 'Em andamento' }} className="block h-full">
            <StatCard
              label="Em andamento"
              value={stats.inProgress}
              hint={`${stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}% do total`}
              icon={Clock3}
              tone="info"
            />
          </Link>
        </motion.div>

        <motion.div {...anim(0.06)}>
          <Link to="/cases" search={{ finalized: 'true' }} className="block h-full">
            <StatCard
              label="Finalizados"
              value={stats.closed}
              hint={`${stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}% do total`}
              icon={CheckCircle2}
              tone="primary"
            />
          </Link>
        </motion.div>

        <motion.div {...anim(0.09)}>
          <Link to="/cases" search={{ priority: 'Alta' }} className="block h-full">
            <StatCard label="Alta prioridade" value={stats.highPriority} hint="Requer atenção" icon={TrendingUp} tone="warning" />
          </Link>
        </motion.div>

        <motion.div {...anim(0.12)}>
          <Link to="/cases" search={{ overdue: 'true' }} className="block h-full">
            <StatCard label="Vencidos" value={stats.overdue} hint="Prazo expirado" icon={AlertTriangle} tone="destructive" />
          </Link>
        </motion.div>

        <motion.div {...anim(0.15)}>
          <Link to="/cases" search={{}} className="block h-full">
            <StatCard
              label="Réu preso"
              value={stats.defendantArrested}
              hint="Investigados custodiados"
              icon={Gavel}
              tone="purple"
            />
          </Link>
        </motion.div>

        <motion.div {...anim(0.18)}>
          <Link to="/cases" search={{}} className="block h-full">
            <StatCard
              label="Medida protetiva"
              value={stats.protectiveMeasures}
              hint="Com proteção ativa"
              icon={Shield}
              tone="warning"
            />
          </Link>
        </motion.div>
      </div>

      {error ? (
        <Panel title="ERRO AO CARREGAR" accent="destructive" icon={<AlertOctagon className="h-4 w-4 text-destructive" />}>
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={loadCases} className="mt-3 text-xs font-semibold underline">
            Tentar novamente
          </button>
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <motion.div {...anim(0.15)}>
          <Panel
            title="CASOS CRÍTICOS"
            accent="destructive"
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            action={
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
                {criticalCases.length}
              </span>
            }
            className="h-full"
          >
            {criticalCases.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="Sem casos críticos" description="Nenhum inquérito crítico ou vencido no momento." />
            ) : (
              <div className="space-y-2">
                {criticalCases.map((c) => (
                  <Link
                    key={c.id}
                    to="/cases/$caseId"
                    params={{ caseId: c.id }}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-background/35 px-3 py-2.5 transition hover:border-destructive/45"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-bold text-foreground">{c.ppe}</p>
                      <p className="text-[11px] text-destructive/85">
                        {isCaseOverdue(c) ? 'Prazo vencido' : 'Alta prioridade CVLI'}
                      </p>
                    </div>

                    <span className="rounded-md border border-destructive/35 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                      Crítico
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <Link to="/cases" search={{ overdue: 'true' }} className="mt-4 inline-flex text-xs font-semibold text-destructive hover:opacity-80">
              Ver todos os casos críticos →
            </Link>
          </Panel>
        </motion.div>

        <motion.div {...anim(0.2)}>
          <Panel
            title="ALERTAS RECENTES"
            accent="warning"
            icon={<Bell className="h-4 w-4 text-warning" />}
            action={
              <Link to="/alerts" className="text-xs font-semibold text-warning hover:opacity-80">
                Ver todos →
              </Link>
            }
            className="h-full"
          >
            {topAlerts.length === 0 ? (
              <EmptyState icon={Info} title="Sem alertas recentes" description="Tudo sob controle neste momento." />
            ) : (
              <div className="space-y-2">
                {topAlerts.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to="/cases/$caseId"
                    params={{ caseId: a.caseId }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-warning/15 bg-background/35 px-3 py-2.5 transition hover:border-warning/35"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAlertBadgeClass(a.severity)}`}>
                        {getAlertLabel(a.severity)}
                      </span>

                      <p className="truncate text-sm text-foreground/90">
                        {a.message} · <span className="font-mono text-[11px] text-muted-foreground">{a.casePpe}</span>
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] text-warning/80">{a.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        <motion.div {...anim(0.25)}>
          <Panel title="META DE CONCLUSÃO" accent="success" className="h-full">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-info" />
                  Procedimentos cadastrados
                </span>
                <span className="font-semibold tabular-nums text-info">{stats.total}</span>
              </li>

              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Finalizados
                </span>
                <span className="font-semibold tabular-nums text-success">{stats.closed}</span>
              </li>

              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Em andamento
                </span>
                <span className="font-semibold tabular-nums text-warning">{stats.inProgress}</span>
              </li>

              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple" />
                  Pendências ativas
                </span>
                <span className="font-semibold tabular-nums text-purple">
                  {stats.overdue + stats.noDeadline + stats.noRecentUpdate}
                </span>
              </li>
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-success/25 bg-success/5 px-3 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">Taxa de resolução</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.closed} de {stats.total} finalizados
                </p>
              </div>

              <div className="relative h-14 w-14 rounded-full border border-border bg-background p-1">
                <div
                  className="absolute inset-1 rounded-full"
                  style={{
                    background: `conic-gradient(var(--success) ${resolutionRate}%, color-mix(in oklab, var(--border) 80%, transparent) ${resolutionRate}% 100%)`,
                  }}
                />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-background text-sm font-bold text-foreground">
                  {resolutionRate}%
                </div>
              </div>
            </div>
          </Panel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DonutPanel title="POR SITUAÇÃO" data={statusDonutData} total={totalByStatus} accent="success" />
        <DonutPanel title="POR GRAVIDADE" data={severityDonutData} total={totalBySeverity} accent="destructive" />

        <Panel title="PROCEDIMENTOS POR TIPO" accent="info" action={<Expand className="h-4 w-4 text-muted-foreground" />} className="h-full">
          <BarList items={procedureByType} emptyIcon={FileText} emptyTitle="Nenhum tipo informado" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="CVLI — COMPARATIVO ANUAL" accent="success" className="xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-5">
            <LegendItem color="var(--info)" label="Registros" />
            <LegendItem color="var(--success)" label="Elucidados" />
            <LegendItem color="var(--foreground)" label="Taxa de elucidação (%)" line />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cvliElucidationData} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="ano" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'Taxa de elucidação (%)') return [`${value}%`, name];
                    return [value, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="registros" name="Registros" fill="var(--info)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="elucidados" name="Elucidados" fill="var(--success)" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="percentual"
                  name="Taxa de elucidação (%)"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--foreground)' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="CVLI — RESUMO ANUAL" accent="success" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Ano</th>
                  <th className="px-4 py-3 text-right font-bold">Reg</th>
                  <th className="px-4 py-3 text-right font-bold">Eluc</th>
                  <th className="px-4 py-3 text-right font-bold">%</th>
                </tr>
              </thead>

              <tbody>
                {cvliElucidationData.map((item) => (
                  <tr key={item.key} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{item.ano}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.registros}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.elucidados}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-success">
                      {item.percentual.toFixed(1)}%
                    </td>
                  </tr>
                ))}

                <tr className="border-t border-border bg-muted/30 font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right tabular-nums">{cvliTotals.registros}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{cvliTotals.elucidados}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">
                    {cvliTotals.registros ? ((cvliTotals.elucidados / cvliTotals.registros) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="PENDÊNCIAS POR CATEGORIA" accent="warning" icon={<Bell className="h-4 w-4 text-warning" />}>
          {pendingByCategory.length === 0 ? (
            <EmptyState icon={Info} title="Nenhuma pendência ativa" description="Os indicadores principais não apontam pendências no momento." />
          ) : (
            <ul className="space-y-3">
              {pendingByCategory.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--${item.tone})` }}
                  />
                  <span className="flex-1 text-sm text-foreground/90">{item.label}</span>
                  <span className="text-sm font-bold tabular-nums text-warning">{item.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="DISTRIBUIÇÃO POR EQUIPE" accent="success" icon={<Users className="h-4 w-4 text-success" />}>
          <BarList items={chartByTeam} emptyIcon={Users} emptyTitle="Nenhuma equipe informada" />

          {chartByTeam.length > 0 ? (
            <div className="mt-5 rounded-lg border border-info/20 bg-info/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                <Info className="h-3.5 w-3.5 text-info" />
                Maior concentração atual
              </div>
              <div className="text-[11px] text-muted-foreground">
                {chartByTeam[0].name}: <span className="font-bold text-success">{chartByTeam[0].count} caso(s)</span>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      {!loading && !error && cases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum inquérito encontrado"
          description="Cadastre um novo inquérito para iniciar os indicadores do dashboard."
        />
      ) : null}
    </div>
  );
}
