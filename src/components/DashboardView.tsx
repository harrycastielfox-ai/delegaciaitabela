import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
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
  BarChart,
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
  tint,
  border,
  iconBg,
  to,
  search,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  tint: string;
  border: string;
  iconBg: string;
  to?: '/cases';
  search?: Record<string, string>;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">{label}</p>
          <p className="mt-2 text-4xl font-black leading-none tracking-tight text-white">{value}</p>
          <p className="mt-2 text-xs text-white/60">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </>
  );

  const classes = `kpi-card relative overflow-hidden rounded-2xl border bg-gradient-to-br ${tint} p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,0,0.35)] ${border}`;

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

export function DashboardView() {
  const navigate = useNavigate();
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
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      map[c.situation] = (map[c.situation] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const chartByTeam = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      const team = (c.team || 'Sem equipe').split(' - ')[0];
      map[team] = (map[team] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  const chartBySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      map[c.severity] = (map[c.severity] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const cvliElucidationData = useMemo(() => {
    const yearSet = new Set<number>();

    cases.forEach((c) => {
      if (c.createdAt) {
        const createdDate = new Date(c.createdAt);
        if (!Number.isNaN(createdDate.getTime())) yearSet.add(createdDate.getFullYear());
      }
      if (c.reportDate) {
        const reportDate = new Date(c.reportDate);
        if (!Number.isNaN(reportDate.getTime())) yearSet.add(reportDate.getFullYear());
      }
    });

    const years = [...yearSet].sort((a, b) => a - b);

    const byYear = years.reduce<Record<number, { year: number; registros: number; elucidados: number; percentual: number }>>((acc, year) => {
      acc[year] = { year, registros: 0, elucidados: 0, percentual: 0 };
      return acc;
    }, {} as Record<number, { year: number; registros: number; elucidados: number; percentual: number }>);

    cases.forEach((c) => {
      if ((c.type === 'IP' || c.type === 'APF') && c.createdAt) {
        const createdAt = new Date(c.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
          const createdYear = createdAt.getFullYear();
          if (c.severity === 'CVLI' && byYear[createdYear]) byYear[createdYear].registros += 1;
        }
      }

      if (c.situation === 'Relatado' && c.reportDate) {
        const reportDate = new Date(c.reportDate);
        if (!Number.isNaN(reportDate.getTime())) {
          const reportYear = reportDate.getFullYear();
          if (byYear[reportYear]) byYear[reportYear].elucidados += 1;
        }
      }
    });

    return years.map((year) => {
      const registros = byYear[year].registros;
      const elucidados = byYear[year].elucidados;
      const percentual = registros === 0 ? 0 : Number(((elucidados / registros) * 100).toFixed(1));

      return {
        ...byYear[year],
        percentual,
      };
    });
  }, [cases]);

  const navigateToCvliYearCases = (entry: { year?: number; payload?: { year?: number } }, dataKey: 'registros' | 'elucidados') => {
    const year = entry?.year ?? entry?.payload?.year;
    if (!year) return;

    if (dataKey === 'registros') {
      navigate({
        to: '/cases',
        search: {
          severity: 'CVLI',
          type: 'IP,APF',
          createdYear: String(year),
        },
      });
      return;
    }

    navigate({
      to: '/cases',
      search: {
        situation: 'Relatado',
        reportYear: String(year),
      },
    });
  };

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

  const chartCardClass = 'section-card rounded-2xl border border-white/10 bg-[#0a1217] p-4';

  return (
    <div className="space-y-6 rounded-2xl bg-[#050a0d] p-3 md:p-4 lg:p-5">
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        <KpiCard label="Total" value={stats.total} subtitle="Inquéritos cadastrados" icon={FileText} tint="from-[#09241a] to-[#0f151c]" border="border-[#1de28f66] hover:border-[#2cffab]" iconBg="bg-[#1de28f33]" />
        <KpiCard label="Em andamento" value={stats.inProgress} subtitle={`${stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}% do total`} icon={Clock3} tint="from-[#0a2035] to-[#0f151c]" border="border-[#2a9fff5a] hover:border-[#38bdf8]" iconBg="bg-[#2a9fff33]" to="/cases" search={{ situation: 'Em andamento' }} />
        <KpiCard label="Finalizados" value={stats.closed} subtitle={`${stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}% do total`} icon={CheckCircle2} tint="from-[#082722] to-[#0f151c]" border="border-[#12d68166] hover:border-[#10e692]" iconBg="bg-[#12d68133]" to="/cases" search={{ finalized: 'true' }} />
        <KpiCard label="Alta prioridade" value={stats.highPriority} subtitle="Requer atenção" icon={TrendingUp} tint="from-[#2d2108] to-[#18140d]" border="border-[#f7c9485f] hover:border-[#facc15]" iconBg="bg-[#f7c9483d]" to="/cases" search={{ priority: 'Alta' }} />
        <KpiCard label="Vencidos" value={stats.overdue} subtitle="Prazo expirado" icon={AlertTriangle} tint="from-[#2f0d12] to-[#1b1012]" border="border-[#ef44446b] hover:border-[#ef4444]" iconBg="bg-[#ef444438]" to="/cases" search={{ overdue: 'true' }} />
        <KpiCard label="Sem prazo" value={stats.noDeadline} subtitle="Sem data limite" icon={CalendarOff} tint="from-[#25123a] to-[#130f1a]" border="border-[#a78bfa69] hover:border-[#a78bfa]" iconBg="bg-[#a78bfa33]" to="/cases" search={{ noDeadline: 'true' }} />
        <KpiCard label="Sem atualização" value={stats.noRecentUpdate} subtitle="+ 15 dias" icon={AlertCircle} tint="from-[#322305] to-[#18140d]" border="border-[#f59e0b67] hover:border-[#f59e0b]" iconBg="bg-[#f59e0b36]" to="/cases" search={{ noUpdate: 'true' }} />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={loadCases} className="mt-2 text-xs font-semibold underline">Tentar novamente</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div {...anim(0.15)} className="section-card rounded-2xl border border-red-500/35 bg-gradient-to-br from-red-950/35 to-[#120f13] p-4">
          <div className="mb-3 flex items-center justify-between border-b border-red-500/20 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-red-400">Casos Críticos</h3>
            </div>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-300">{criticalCases.length}</span>
          </div>
          {criticalCases.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Sem casos críticos" description="Nenhum inquérito crítico ou vencido no momento." />
          ) : (
            <div className="space-y-2">
              {criticalCases.map((c) => (
                <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="group flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-[#140f12] px-3 py-2.5 transition hover:border-red-400/40">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-white">{c.ppe}</p>
                    <p className="text-xs text-red-200/85">{isCaseOverdue(c) ? 'Prazo vencido' : 'Alta prioridade CVLI'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-red-300/70 transition group-hover:text-red-200" />
                </Link>
              ))}
            </div>
          )}
          <Link to="/cases" search={{ overdue: 'true' }} className="mt-3 inline-flex text-xs font-semibold text-red-300 hover:text-red-200">
            Ver todos os casos críticos →
          </Link>
        </motion.div>

        <motion.div {...anim(0.2)} className="section-card rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/30 to-[#14120d] p-4">
          <div className="mb-3 flex items-center justify-between border-b border-amber-400/20 pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-amber-300">Alertas Recentes</h3>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-amber-300 hover:text-amber-200">Ver todos →</Link>
          </div>
          {topAlerts.length === 0 ? (
            <EmptyState icon={Info} title="Sem alertas recentes" description="Tudo sob controle neste momento." />
          ) : (
            <div className="space-y-2">
              {topAlerts.slice(0, 4).map((a) => (
                <Link key={a.id} to="/cases/$caseId" params={{ caseId: a.caseId }} className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/15 bg-[#14120d] px-3 py-2.5 transition hover:border-amber-300/35">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/90">{a.message}</p>
                    <p className="truncate font-mono text-xs text-white/55">{a.casePpe}</p>
                  </div>
                  <span className="text-xs text-amber-200/80">{a.time}</span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div {...anim(0.25)} className="section-card rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 to-[#0f1513] p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-primary">Situação Operacional</h3>
          <div className="space-y-2 text-sm">
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
          <h3 className="mb-3 text-lg font-black uppercase tracking-[0.06em] text-primary">Por Situação</h3>
          {chartByStatus.length === 0 ? (
            <EmptyState icon={Activity} title="Nenhum dado disponível ainda" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={chartByStatus} dataKey="value" nameKey="name" cx="42%" cy="50%" innerRadius={62} outerRadius={92} stroke="#0a1217" strokeWidth={2}>
                  {chartByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '11px', color: '#dbe2ea' }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div {...anim(0.35)} className={chartCardClass}>
          <h3 className="mb-3 text-lg font-black uppercase tracking-[0.06em] text-primary">Por Equipe</h3>
          {chartByTeam.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum dado disponível ainda" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartByTeam.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2a30" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9cb0bf' }} />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: '#dbe2ea' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#12d681" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div {...anim(0.4)} className={chartCardClass}>
          <h3 className="mb-3 text-lg font-black uppercase tracking-[0.06em] text-primary">Por Gravidade</h3>
          {chartBySeverity.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Nenhum dado disponível ainda" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={chartBySeverity} dataKey="value" nameKey="name" cx="42%" cy="50%" innerRadius={62} outerRadius={92} stroke="#0a1217" strokeWidth={2}>
                  {chartBySeverity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '11px', color: '#dbe2ea' }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div {...anim(0.45)} className="section-card rounded-2xl border border-white/10 bg-[#0a1217] p-4">
        <h3 className="mb-4 text-xl font-black tracking-tight text-primary">CVLI – Comparativo de Elucidação</h3>

        {cvliElucidationData.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Nenhum dado CVLI cadastrado ainda" description="Cadastre inquéritos CVLI para visualizar o comparativo anual." />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <ResponsiveContainer width="100%" height={310}>
                <ComposedChart data={cvliElucidationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d2a30" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#dbe2ea' }} />
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
                  <Bar yAxisId="left" dataKey="registros" name="Registros" fill="#3b82f6" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(entry) => navigateToCvliYearCases(entry, 'registros')} />
                  <Bar yAxisId="left" dataKey="elucidados" name="Elucidados" fill="#12d681" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(entry) => navigateToCvliYearCases(entry, 'elucidados')} />
                  <Line yAxisId="right" type="monotone" dataKey="percentual" name="Taxa de elucidação (%)" stroke="#f8fafc" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 xl:col-span-2">
              <table className="w-full min-w-[320px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-3 py-2 font-bold uppercase tracking-[0.1em] text-white/65">Ano</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-[0.1em] text-white/65">Registros</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-[0.1em] text-white/65">Elucidados</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-[0.1em] text-white/65">%</th>
                  </tr>
                </thead>
                <tbody>
                  {cvliElucidationData.map((item) => (
                    <tr key={item.year} className="border-b border-white/5 last:border-b-0">
                      <td className="px-3 py-2 text-white">{item.year}</td>
                      <td className="px-3 py-2 text-white">{item.registros}</td>
                      <td className="px-3 py-2 text-white">{item.elucidados}</td>
                      <td className="px-3 py-2 font-bold text-primary">{item.percentual.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-white/5">
                    <td className="px-3 py-2 text-sm font-black text-white">TOTAL</td>
                    <td className="px-3 py-2 text-sm font-black text-white">{cvliTotals.registros}</td>
                    <td className="px-3 py-2 text-sm font-black text-white">{cvliTotals.elucidados}</td>
                    <td className="px-3 py-2 text-sm font-black text-primary">{cvliTotals.registros ? ((cvliTotals.elucidados / cvliTotals.registros) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-white/55">Clique nas barras para filtrar os casos do ano selecionado</p>
      </motion.div>
    </div>
  );
}
