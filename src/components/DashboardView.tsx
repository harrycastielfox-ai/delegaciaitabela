import { useMemo, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  FileText, AlertTriangle, CheckCircle, Clock, TrendingUp,
  ShieldAlert, CalendarOff, RefreshCw, Activity, ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { getCases, subscribe } from '@/lib/case-store';
import { generateAlerts } from '@/lib/dummy-data';
import type { InvestigationCase } from '@/lib/types';

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

function StatCard({ label, value, icon: Icon, accent, subtitle }: {
  label: string; value: number; icon: any; accent?: string; subtitle?: string;
}) {
  return (
    <motion.div {...anim()} className="stat-card">
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
  const cases = useSyncExternalStore(subscribe, getCases, getCases);
  const alerts = useMemo(() => generateAlerts(cases), [cases]);

  const stats = useMemo(() => {
    const total = cases.length;
    const inProgress = cases.filter((c) => c.situation === 'Em andamento').length;
    const closed = cases.filter((c) => c.situation === 'Relatado' || c.situation === 'Arquivado').length;
    const highPriority = cases.filter((c) => c.priority === 'Alta').length;
    const overdue = alerts.filter((a) => a.type === 'overdue').length;
    const noDeadline = cases.filter((c) => !c.deadline && c.situation !== 'Relatado' && c.situation !== 'Arquivado').length;
    const noRecentUpdate = alerts.filter((a) => a.type === 'no_update').length;
    return { total, inProgress, closed, highPriority, overdue, noDeadline, noRecentUpdate };
  }, [cases, alerts]);

  const chartByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => { map[c.situation] = (map[c.situation] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const chartByTeam = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      const team = c.team.split(' - ')[0];
      map[team] = (map[team] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [cases]);

  const chartBySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => { map[c.severity] = (map[c.severity] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const criticalCases = useMemo(() => {
    return cases.filter((c) => {
      if (c.situation === 'Relatado' || c.situation === 'Arquivado') return false;
      const isOverdue = c.deadline && new Date(c.deadline) < new Date('2025-04-14');
      const isHighPriority = c.priority === 'Alta';
      const isCVLI = c.severity === 'CVLI';
      return isOverdue || (isHighPriority && isCVLI);
    }).slice(0, 5);
  }, [cases]);

  const topAlerts = alerts.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Painel de Controle</h1>
          </div>
          <p className="text-sm text-muted-foreground">Visão operacional dos inquéritos policiais</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>Atualizado: 14/04/2025 08:00</span>
        </div>
      </div>

      {/* Stat Cards - Row 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total" value={stats.total} icon={FileText} />
        <StatCard label="Em Andamento" value={stats.inProgress} icon={Clock} accent="bg-chart-2/15" />
        <StatCard label="Finalizados" value={stats.closed} icon={CheckCircle} accent="bg-primary/10" />
        <StatCard label="Alta Prioridade" value={stats.highPriority} icon={TrendingUp} accent="bg-warning/15" />
        <StatCard label="Vencidos" value={stats.overdue} icon={AlertTriangle} accent="bg-destructive/15" subtitle="Prazo expirado" />
        <StatCard label="Sem Prazo" value={stats.noDeadline} icon={CalendarOff} accent="bg-chart-5/15" />
        <StatCard label="Sem Atualização" value={stats.noRecentUpdate} icon={AlertCircle} accent="bg-warning/15" subtitle="+15 dias" />
      </div>

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
              Ver todos ({alerts.length})
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
    </div>
  );
}
