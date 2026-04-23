import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  FileText, AlertTriangle, CheckCircle, Clock, TrendingUp,
  ShieldAlert, CalendarOff, RefreshCw, Activity, ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  subtitle,
  to,
  search,
}: {
  label: string;
  value: number;
  icon: any;
  accent?: string;
  subtitle?: string;
  to?: '/cases';
  search?: Record<string, string>;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent || 'bg-primary/10'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-foreground' : 'text-primary'}`} />
        </div>
      </div>
    </>
  );

  if (!to) {
    return (
      <motion.div {...anim()} className="stat-card">
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div {...anim()}>
      <Link
        to={to}
        search={search}
        className="stat-card block transition-transform hover:-translate-y-0.5"
        aria-label={`Filtrar casos: ${label}`}
      >
        {content}
      </Link>
    </motion.div>
  );
}

const COLORS = [
  'oklch(0.72 0.19 155)',
  'oklch(0.65 0.15 200)',
  'oklch(0.70 0.18 60)',
  'oklch(0.60 0.22 25)',
  'oklch(0.55 0.15 280)',
];

const tooltipStyle = {
  backgroundColor: 'oklch(0.15 0.005 240)',
  border: '1px solid oklch(0.22 0.005 240)',
  borderRadius: '8px',
  fontSize: '11px',
  color: 'oklch(0.93 0.005 240)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

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
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [cases]);

  const chartBySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      map[c.severity] = (map[c.severity] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const cvliElucidationData = useMemo(() => {
    const now = new Date();
    const monthKeys = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    });

    const byMonth = monthKeys.reduce<Record<string, { month: string; registros: number; elucidados: number; percentual: number }>>((acc, key) => {
      acc[key] = { month: key, registros: 0, elucidados: 0, percentual: 0 };
      return acc;
    }, {});

    cases.forEach((c) => {
      if (c.severity !== 'CVLI') return;

      if ((c.type === 'IP' || c.type === 'APF') && c.createdAt) {
        const createdAt = new Date(c.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
          const createdKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
          if (byMonth[createdKey]) byMonth[createdKey].registros += 1;
        }
      }

      if (c.situation === 'Relatado' && c.reportDate) {
        const reportDate = new Date(c.reportDate);
        if (!Number.isNaN(reportDate.getTime())) {
          const reportKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
          if (byMonth[reportKey]) byMonth[reportKey].elucidados += 1;
        }
      }
    });

    return monthKeys.map((key) => {
      const registros = byMonth[key].registros;
      const elucidados = byMonth[key].elucidados;
      const percentual = registros === 0 ? 0 : Number(((elucidados / registros) * 100).toFixed(1));

      return {
        ...byMonth[key],
        percentual,
      };
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
      }>;

      if (isCaseOverdue(c)) {
        caseAlerts.push({
          id: `overdue-${c.id}`,
          caseId: c.id,
          casePpe: c.ppe,
          message: 'Prazo vencido',
          severity: 'high',
        });
      }

      if (isCaseNoDeadline(c)) {
        caseAlerts.push({
          id: `no-deadline-${c.id}`,
          caseId: c.id,
          casePpe: c.ppe,
          message: 'Sem prazo definido',
          severity: 'low',
        });
      }

      if (isCaseNoRecentUpdate(c)) {
        caseAlerts.push({
          id: `no-update-${c.id}`,
          caseId: c.id,
          casePpe: c.ppe,
          message: 'Sem atualização há mais de 15 dias',
          severity: 'medium',
        });
      }

      return caseAlerts;
    });

    const rank = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 6);
  }, [cases]);

  const refreshLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '---';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Painel de Controle</h1>
          </div>
          <p className="text-sm text-muted-foreground">Visão operacional dos inquéritos policiais</p>
        </div>
        <button onClick={loadCases} className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizado: {refreshLabel}</span>
        </button>
      </div>

      {/* Stat Cards - Row 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total" value={stats.total} icon={FileText} />
        <StatCard label="Em Andamento" value={stats.inProgress} icon={Clock} accent="bg-chart-2/15" to="/cases" search={{ situation: 'Em andamento' }} />
        <StatCard label="Finalizados" value={stats.closed} icon={CheckCircle} accent="bg-primary/10" to="/cases" search={{ finalized: 'true' }} />
        <StatCard label="Alta Prioridade" value={stats.highPriority} icon={TrendingUp} accent="bg-warning/15" to="/cases" search={{ priority: 'Alta' }} />
        <StatCard label="Vencidos" value={stats.overdue} icon={AlertTriangle} accent="bg-destructive/15" subtitle="Prazo expirado" to="/cases" search={{ overdue: 'true' }} />
        <StatCard label="Sem Prazo" value={stats.noDeadline} icon={CalendarOff} accent="bg-chart-5/15" to="/cases" search={{ noDeadline: 'true' }} />
        <StatCard label="Sem Atualização" value={stats.noRecentUpdate} icon={AlertCircle} accent="bg-warning/15" subtitle="+15 dias" to="/cases" search={{ noUpdate: 'true' }} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={loadCases} className="mt-2 text-xs font-semibold underline">Tentar novamente</button>
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum inquérito encontrado para exibir no dashboard.
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div {...anim(0.1)} className="section-card">
          <h3 className="section-card-header">Por Situação</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} strokeWidth={2} stroke="oklch(0.11 0.005 240)">
                {chartByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: '10px', color: 'oklch(0.55 0.01 240)' }} />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(0.15)} className="section-card">
          <h3 className="section-card-header">Por Equipe</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartByTeam} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.005 240)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 240)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'oklch(0.55 0.01 240)' }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="oklch(0.72 0.19 155)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(0.2)} className="section-card">
          <h3 className="section-card-header">Por Gravidade</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} strokeWidth={2} stroke="oklch(0.11 0.005 240)">
                {chartBySeverity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: '10px', color: 'oklch(0.55 0.01 240)' }} />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Critical Cases + Alerts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Critical Cases */}
        <motion.div {...anim(0.25)} className="section-card border-destructive/20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-destructive">Casos Críticos</h3>
            </div>
            <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-[10px] font-bold text-destructive">{criticalCases.length}</span>
          </div>
          {criticalCases.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Nenhum caso crítico no momento.</p>
          ) : (
            <div className="space-y-2">
              {criticalCases.map((c) => (
                <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="group flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/70">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="font-mono text-[11px] font-semibold text-primary">{c.ppe}</span>
                  <span className="flex-1 truncate text-xs text-foreground">{c.crimeClassification}</span>
                  <span className="badge-high rounded-full px-2 py-0.5 text-[9px] font-bold">{c.priority}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Alerts */}
        <motion.div {...anim(0.3)} className="section-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Alertas Recentes</h3>
            </div>
            <Link to="/alerts" className="text-[10px] font-semibold text-primary hover:underline">
              Ver todos ({topAlerts.length})
            </Link>
          </div>
          {topAlerts.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Nenhum alerta no momento.</p>
          ) : (
            <div className="space-y-2">
              {topAlerts.map((a) => (
                <Link key={a.id} to="/cases/$caseId" params={{ caseId: a.caseId }} className="group flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/70">
                  <div className={`h-2 w-2 rounded-full ${a.severity === 'high' ? 'bg-destructive' : a.severity === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                  <span className="font-mono text-[11px] text-muted-foreground">{a.casePpe}</span>
                  <span className="flex-1 truncate text-xs text-foreground">{a.message}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* CVLI - Comparativo de Elucidação */}
      <motion.div {...anim(0.35)} className="section-card">
        <h3 className="section-card-header">CVLI – Comparativo de Elucidação</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={cvliElucidationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.005 240)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 240)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 240)' }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string, payload) => {
                if (name === 'Percentual' && payload && payload.payload) return [`${payload.payload.percentual}%`, 'Percentual'];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', color: 'oklch(0.55 0.01 240)' }} />
            <Bar dataKey="registros" name="Registros" fill="oklch(0.65 0.15 200)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="elucidados" name="Elucidados" fill="oklch(0.72 0.19 155)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
