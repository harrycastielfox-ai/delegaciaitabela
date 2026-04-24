import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Expand,
  FileText,
  Filter,
  Info,
  CalendarOff,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
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
  Outros: '#a78bfa',
};
const SEVERITY_COLORS: Record<string, string> = {
  CVLI: '#ff4d4f',
  CVP: '#facc15',
  Patrimonial: '#21a5ff',
  Drogas: '#a78bfa',
  Outros: '#34d399',
};
const STATUS_ORDER = ['Em andamento', 'Finalizados', 'Outros'];
const SEVERITY_ORDER = ['CVLI', 'CVP', 'Patrimonial'];

const tooltipStyle = {
  backgroundColor: '#0d1419',
  border: '1px solid rgba(35, 252, 143, 0.18)',
  borderRadius: '10px',
  fontSize: '11px',
  color: '#f4f7fa',
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
    <div className="flex h-full min-h-[170px] flex-col items-center justify-center rounded-xl border border-white/5 bg-[#0b1217] px-4 text-center">
      <Icon className="mb-3 h-5 w-5 text-primary/80" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  border,
  iconClass,
  to,
  search,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  border: string;
  iconClass: string;
  to?: '/cases';
  search?: Record<string, string>;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{label}</p>
          <p className="mt-1.5 text-3xl font-black leading-none tracking-tight text-white">{value}</p>
          <p className="mt-1.5 text-[11px] text-white/50">{subtitle}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/35 bg-white/[0.03] ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </>
  );

  const classes = `kpi-card relative block h-full w-full min-h-[124px] min-w-[185px] overflow-hidden rounded-xl border bg-[#0b1217] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] ${border}`;

  if (to) {
    return (
      <motion.div {...anim()}>
        <Link to={to} search={search} aria-label={`Filtrar casos: ${label}`} className={classes}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div {...anim()} className={classes}>
      {content}
    </motion.div>
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

    return { total, inProgress, closed, highPriority, overdue, noDeadline, noRecentUpdate };
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
      .map(([name, count]) => ({ name, count, percentage: stats.total ? Math.round((count / stats.total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [cases, stats.total]);

  const chartBySeverity = useMemo(() => {
    const map = { CVLI: 0, CVP: 0, Patrimonial: 0 };
    cases.forEach((c) => {
      if (c.severity === 'CVLI' || c.severity === 'CVP' || c.severity === 'Patrimonial') {
        map[c.severity] += 1;
      }
    });
    return SEVERITY_ORDER.map((name) => ({ name, value: map[name as keyof typeof map] })).filter((item) => item.value > 0);
  }, [cases]);

  const cvliElucidationData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, index) => currentYear - (5 - index));
    const byYear = years.reduce<Record<number, { key: string; ano: number; registros: number; elucidados: number; percentual: number }>>((acc, year) => {
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
      if ((c.type === 'IP' || c.type === 'APF') && c.crimeClassification === 'CVLI' && c.createdAt) {
        const createdAt = new Date(c.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
          const year = createdAt.getFullYear();
          if (byYear[year]) byYear[year].registros += 1;
        }
      }

      if (c.situation === 'Relatado' && c.reportSent && c.reportDate) {
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

  const chartCardClass = 'section-card h-full rounded-xl border border-white/10 bg-[#0b1217] p-4';
  const totalByStatus = chartByStatus.reduce((acc, item) => acc + item.value, 0);
  const totalBySeverity = chartBySeverity.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="space-y-5 rounded-2xl bg-[#050a0d] p-3 md:p-4 lg:p-5 2xl:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/15 shadow-[0_0_20px_rgba(17,205,122,0.35)]">
              <Activity className="h-4 w-4 text-primary" />
              <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full border border-primary/20" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white">Painel de Controle</h1>
          </div>
          <p className="text-sm text-white/70">Visão operacional dos inquéritos policiais</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/30"
          >
            <Sparkles className="h-4 w-4" />
            + Novo Inquérito
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/60"
            title="Filtros rápidos em breve"
          >
            <Filter className="h-4 w-4" />
            Filtros Rápidos
          </button>
          <button onClick={loadCases} className="ml-auto inline-flex items-center gap-2 text-xs text-white/60 hover:text-white">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizado: {refreshLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <KpiCard label="Total" value={stats.total} subtitle="Inquéritos cadastrados" icon={FileText} border="border-emerald-400/45 bg-gradient-to-b from-emerald-500/20 via-emerald-500/8 to-[#0b1217] hover:border-emerald-300" iconClass="text-emerald-300" />
        <KpiCard label="Em andamento" value={stats.inProgress} subtitle={`${stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}% do total`} icon={Clock3} border="border-sky-400/45 bg-gradient-to-b from-sky-500/20 via-sky-500/8 to-[#0b1217] hover:border-sky-300" iconClass="text-sky-300" to="/cases" search={{ situation: 'Em andamento' }} />
        <KpiCard label="Finalizados" value={stats.closed} subtitle={`${stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}% do total`} icon={CheckCircle2} border="border-teal-400/45 bg-gradient-to-b from-teal-500/20 via-teal-500/8 to-[#0b1217] hover:border-teal-300" iconClass="text-teal-300" to="/cases" search={{ finalized: 'true' }} />
        <KpiCard label="Alta prioridade" value={stats.highPriority} subtitle="Requer atenção" icon={TrendingUp} border="border-amber-400/45 bg-gradient-to-b from-amber-500/20 via-amber-500/8 to-[#0b1217] hover:border-amber-300" iconClass="text-amber-300" to="/cases" search={{ priority: 'Alta' }} />
        <KpiCard label="Vencidos" value={stats.overdue} subtitle="Prazo expirado" icon={AlertTriangle} border="border-red-400/55 bg-gradient-to-b from-red-500/20 via-red-500/8 to-[#0b1217] hover:border-red-300" iconClass="text-red-300" to="/cases" search={{ overdue: 'true' }} />
        <KpiCard label="Sem prazo" value={stats.noDeadline} subtitle="Sem data limite" icon={CalendarOff} border="border-violet-400/45 bg-gradient-to-b from-violet-500/20 via-violet-500/8 to-[#0b1217] hover:border-violet-300" iconClass="text-violet-300" to="/cases" search={{ noDeadline: 'true' }} />
        <KpiCard label="Sem atualização" value={stats.noRecentUpdate} subtitle="+ 15 dias" icon={AlertCircle} border="border-orange-400/45 bg-gradient-to-b from-orange-500/20 via-orange-500/8 to-[#0b1217] hover:border-orange-300" iconClass="text-orange-300" to="/cases" search={{ noUpdate: 'true' }} />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={loadCases} className="mt-2 text-xs font-semibold underline">Tentar novamente</button>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <motion.div {...anim(0.15)} className="section-card flex h-full flex-col rounded-xl border border-red-500/35 bg-[#0b1217] p-4">
          <div className="mb-2 flex items-center justify-between border-b border-red-500/20 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-red-400">Casos Críticos</h3>
            </div>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-300">{criticalCases.length}</span>
          </div>
          <div className="flex-1">
            {criticalCases.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="Sem casos críticos" description="Nenhum inquérito crítico ou vencido no momento." />
            ) : (
              <div className="space-y-1.5">
                {criticalCases.map((c) => (
                  <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="group flex items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-[#11161b] px-2.5 py-2 transition hover:border-red-400/40">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-bold text-white">{c.ppe}</p>
                      <p className="text-[11px] text-red-200/85">{isCaseOverdue(c) ? 'Vencido há prazo excedido' : 'Alta prioridade CVLI'}</p>
                    </div>
                    <span className="rounded-md border border-red-400/35 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">Vencido</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/cases" search={{ overdue: 'true' }} className="mt-3 inline-flex text-xs font-semibold text-red-300 hover:text-red-200">
            Ver todos os casos críticos →
          </Link>
        </motion.div>

        <motion.div {...anim(0.2)} className="section-card flex h-full flex-col rounded-xl border border-amber-400/30 bg-[#0b1217] p-4">
          <div className="mb-2 flex items-center justify-between border-b border-amber-400/20 pb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-amber-300">Alertas Recentes</h3>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-amber-300 hover:text-amber-200">Ver todos →</Link>
          </div>
          <div className="flex-1">
            {topAlerts.length === 0 ? (
              <EmptyState icon={Info} title="Sem alertas recentes" description="Tudo sob controle neste momento." />
            ) : (
              <div className="space-y-1.5">
                {topAlerts.slice(0, 4).map((a) => (
                  <Link key={a.id} to="/cases/$caseId" params={{ caseId: a.caseId }} className="flex items-center justify-between gap-2 rounded-lg border border-amber-300/15 bg-[#11161b] px-2.5 py-2 transition hover:border-amber-300/35">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAlertBadgeClass(a.severity)}`}>
                        {getAlertLabel(a.severity)}
                      </span>
                      <p className="truncate text-sm text-white/90">{a.message} · <span className="font-mono text-[11px] text-white/50">{a.casePpe}</span></p>
                    </div>
                    <span className="shrink-0 text-[11px] text-amber-200/80">{a.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...anim(0.25)} className="section-card flex h-full flex-col rounded-xl border border-emerald-500/30 bg-[#0b1217] p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-primary">Situação Operacional</h3>
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0b1114] px-3 py-2"><span className="text-white/70">Inquéritos ativos</span><span className="font-bold text-cyan-300">{stats.inProgress}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0b1114] px-3 py-2"><span className="text-white/70">Vencidos</span><span className="font-bold text-red-400">{stats.overdue}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0b1114] px-3 py-2"><span className="text-white/70">Sem atualização (+15 dias)</span><span className="font-bold text-amber-300">{stats.noRecentUpdate}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0b1114] px-3 py-2"><span className="text-white/70">Sem prazo definido</span><span className="font-bold text-violet-300">{stats.noDeadline}</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/35 bg-primary/10 px-3 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-primary">Taxa de resolução</p>
              <p className="mt-1 text-sm text-white/80">{stats.closed} de {stats.total} finalizados</p>
            </div>
            <div className="relative h-14 w-14 rounded-full border border-white/15 bg-[#0b1114] p-1">
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  background: `conic-gradient(#12d681 ${resolutionRate}%, rgba(255,255,255,0.08) ${resolutionRate}% 100%)`,
                }}
              />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#0b1114] text-sm font-bold text-white">{resolutionRate}%</div>
            </div>
          </div>
        </motion.div>
      </div>

      {!loading && !error && cases.length === 0 && (
        <EmptyState icon={FileText} title="Nenhum inquérito encontrado" description="Cadastre um novo inquérito para iniciar os indicadores do dashboard." />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div {...anim(0.3)} className={chartCardClass}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-[0.06em] text-primary">Por Situação</h3>
            <Expand className="h-4 w-4 text-white/40" />
          </div>
          {chartByStatus.length === 0 ? (
            <EmptyState icon={Activity} title="Nenhum dado disponível ainda" />
          ) : (
            <div className="grid h-[260px] grid-cols-1 items-center gap-4 md:grid-cols-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={86} stroke="#0a1217" strokeWidth={2}>
                    {chartByStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <p className="text-4xl font-black leading-none text-white">{totalByStatus}</p>
                <p className="text-xs text-white/60">Total</p>
                {chartByStatus.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/90"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || '#fff' }} />{item.name}</span>
                    <span className="text-white/70">{item.value} ({totalByStatus ? Math.round((item.value / totalByStatus) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div {...anim(0.35)} className={chartCardClass}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-[0.06em] text-primary">Por Equipe</h3>
            <Expand className="h-4 w-4 text-white/40" />
          </div>
          {chartByTeam.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum dado disponível ainda" />
          ) : (
            <div className="space-y-3 pt-2">
              {chartByTeam.slice(0, 4).map((team) => (
                <div key={team.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{team.name}</span>
                    <span className="text-white/60">{team.count} ({team.percentage}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5">
                    <div className="h-2.5 rounded-full bg-emerald-400" style={{ width: `${team.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div {...anim(0.4)} className={chartCardClass}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-[0.06em] text-primary">Por Gravidade</h3>
            <Expand className="h-4 w-4 text-white/40" />
          </div>
          {chartBySeverity.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Nenhum dado disponível ainda" />
          ) : (
            <div className="grid h-[260px] grid-cols-1 items-center gap-4 md:grid-cols-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={86} stroke="#0a1217" strokeWidth={2}>
                    {chartBySeverity.map((entry, i) => <Cell key={i} fill={SEVERITY_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <p className="text-4xl font-black leading-none text-white">{totalBySeverity}</p>
                <p className="text-xs text-white/60">Total</p>
                {chartBySeverity.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/90"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[item.name] || '#fff' }} />{item.name}</span>
                    <span className="text-white/70">{item.value} ({totalBySeverity ? Math.round((item.value / totalBySeverity) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div {...anim(0.45)} className="section-card rounded-xl border border-white/10 bg-[#0b1217] p-4">
        <h3 className="mb-3 text-lg font-black tracking-tight text-primary">CVLI – Comparativo de Elucidação</h3>

        {cvliElucidationData.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Nenhum dado CVLI cadastrado ainda" description="Cadastre inquéritos CVLI para visualizar o comparativo anual." />
        ) : (
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-12">
            <div className="2xl:col-span-8">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={cvliElucidationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d2a30" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11, fill: '#dbe2ea' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9cb0bf' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9cb0bf' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === 'Taxa de elucidação (%)') return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="registros" name="Registros" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="left" dataKey="elucidados" name="Elucidados" fill="#12d681" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="percentual" name="Taxa de elucidação (%)" stroke="#f8fafc" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10 2xl:col-span-4">
              <table className="w-full min-w-[320px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-2.5 py-1.5 font-bold uppercase tracking-[0.1em] text-white/65">Ano</th>
                    <th className="px-2.5 py-1.5 font-bold uppercase tracking-[0.1em] text-white/65">Registros</th>
                    <th className="px-2.5 py-1.5 font-bold uppercase tracking-[0.1em] text-white/65">Elucidados</th>
                    <th className="px-2.5 py-1.5 font-bold uppercase tracking-[0.1em] text-white/65">%</th>
                  </tr>
                </thead>
                <tbody>
                  {cvliElucidationData.map((item) => (
                    <tr key={item.key} className="border-b border-white/5 last:border-b-0">
                      <td className="px-2.5 py-1.5 text-white">{item.ano}</td>
                      <td className="px-2.5 py-1.5 text-white">{item.registros}</td>
                      <td className="px-2.5 py-1.5 text-white">{item.elucidados}</td>
                      <td className="px-2.5 py-1.5 font-bold text-primary">{item.percentual.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-white/5">
                    <td className="px-2.5 py-1.5 text-sm font-black text-white">TOTAL</td>
                    <td className="px-2.5 py-1.5 text-sm font-black text-white">{cvliTotals.registros}</td>
                    <td className="px-2.5 py-1.5 text-sm font-black text-white">{cvliTotals.elucidados}</td>
                    <td className="px-2.5 py-1.5 text-sm font-black text-primary">{cvliTotals.registros ? ((cvliTotals.elucidados / cvliTotals.registros) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-white/55">Últimos 6 anos (ordem cronológica)</p>
      </motion.div>
    </div>
  );
}
