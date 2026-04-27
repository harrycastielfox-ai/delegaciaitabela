import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  Gavel,
  Info,
  Maximize2,
  Shield,
  TrendingUp,
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

const COLORS = {
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  purple: 'var(--purple)',
  foreground: 'var(--foreground)',
};

function Legend({ color, label, line = false }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {line ? <span className="h-0.5 w-4" style={{ backgroundColor: color }} /> : <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />}
      {label}
    </span>
  );
}

function DonutPanel({
  title,
  data,
  accent,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  accent: 'success' | 'warning' | 'destructive' | 'muted' | 'info' | 'primary' | 'purple';
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Panel title={title} accent={accent} action={<Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />}>
      <div className="flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={45} outerRadius={68} paddingAngle={2} stroke="none">
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{total}</span>
            <span className="text-[10px] text-muted-foreground">Total</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2 text-sm">
          {data.map((d) => {
            const pct = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <li key={d.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                <span className="flex-1 text-foreground/90 text-xs truncate">{d.name}</span>
                <span className="tabular-nums text-muted-foreground text-xs">
                  {d.value} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}

export function DashboardLovableAdapter() {
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
      console.error(err);
      setError('Não foi possível carregar os dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const stats = useMemo(() => {
    const total = cases.length;
    const emAndamento = cases.filter((c) => c.situation === 'Em andamento').length;
    const concluidos = cases.filter((c) => isFinalizedSituation(c.situation)).length;
    const prioridadeAlta = cases.filter((c) => c.priority === 'Alta').length;
    const prazoCritico = cases.filter((c) => isCaseOverdue(c)).length;
    const reuPreso = cases.filter((c) => c.defendantArrested).length;
    const medidasProtetivas = cases.filter((c) => c.protectiveMeasure).length;
    const semPrazo = cases.filter((c) => isCaseNoDeadline(c)).length;
    const semAtualizacao = cases.filter((c) => isCaseNoRecentUpdate(c)).length;

    return {
      total,
      emAndamento,
      concluidos,
      prioridadeAlta,
      prazoCritico,
      reuPreso,
      medidasProtetivas,
      semPrazo,
      semAtualizacao,
      taxaConclusao: total ? Math.round((concluidos / total) * 100) : 0,
    };
  }, [cases]);

  const bySituation = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.situation, (map.get(c.situation) || 0) + 1));
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: [COLORS.info, COLORS.success, COLORS.warning, COLORS.purple, COLORS.destructive][idx % 5],
    }));
  }, [cases]);

  const byPriority = useMemo(() => {
    const order = ['Alta', 'Média', 'Baixa'] as const;
    const colorByName: Record<string, string> = { Alta: COLORS.destructive, 'Média': COLORS.warning, Baixa: COLORS.success };
    return order
      .map((name) => ({ name, value: cases.filter((c) => c.priority === name).length, color: colorByName[name] }))
      .filter((item) => item.value > 0);
  }, [cases]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.type, (map.get(c.type) || 0) + 1));
    return Array.from(map.entries())
      .map(([sigla, total]) => ({ sigla, total }))
      .sort((a, b) => b.total - a.total);
  }, [cases]);

  const annualCvli = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 4 }, (_, idx) => currentYear - (3 - idx));

    return years.map((year) => {
      const registros = cases.filter((c) => {
        const date = new Date(c.createdAt);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === year && c.severity === 'CVLI';
      }).length;

      const elucidados = cases.filter((c) => {
        const date = new Date(c.reportDate || c.updatedAt || c.createdAt);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === year && c.severity === 'CVLI' && isFinalizedSituation(c.situation);
      }).length;

      return {
        ano: year,
        registros,
        elucidados,
        taxa: registros ? Number(((elucidados / registros) * 100).toFixed(1)) : 0,
      };
    });
  }, [cases]);

  const topDistricts = useMemo(() => {
    const rows = new Map<string, { total: number; cvli: number; alta: number }>();

    cases.forEach((c) => {
      const key = c.district || c.location || 'Não informado';
      const current = rows.get(key) || { total: 0, cvli: 0, alta: 0 };
      current.total += 1;
      if (c.severity === 'CVLI') current.cvli += 1;
      if (c.priority === 'Alta') current.alta += 1;
      rows.set(key, current);
    });

    return Array.from(rows.entries())
      .map(([bairro, values]) => ({ bairro, ...values }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [cases]);

  const bySeverity = useMemo(() => {
    const all = ['CVLI', 'CVP', 'Patrimonial', 'Drogas', 'Outros'] as const;
    return all
      .map((name) => ({ name, value: cases.filter((c) => c.severity === name).length }))
      .filter((item) => item.value > 0);
  }, [cases]);

  const byTeam = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => {
      const teamName = c.team || 'Sem equipe';
      map.set(teamName, (map.get(teamName) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, pct: stats.total ? Math.round((value / stats.total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [cases, stats.total]);

  const pendencias = [
    { label: 'Prazos vencidos', value: stats.prazoCritico },
    { label: 'Sem prazo definido', value: stats.semPrazo },
    { label: 'Sem atualização (> 15 dias)', value: stats.semAtualizacao },
    { label: 'Prioridade alta', value: stats.prioridadeAlta },
  ].filter((row) => row.value > 0);

  const refreshLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '---';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Painel de Controle"
        subtitle="Delegacia Territorial de Itabela — visão executiva em dados reais"
        updatedAt={refreshLabel}
        loading={loading}
        onRefresh={loadCases}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
        <StatCard label="TOTAL" value={stats.total} hint="Procedimentos cadastrados" icon={FileText} tone="success" />
        <StatCard label="EM ANDAMENTO" value={stats.emAndamento} hint={`${stats.total ? Math.round((stats.emAndamento / stats.total) * 100) : 0}% do total`} icon={Clock3} tone="info" />
        <StatCard label="CONCLUÍDOS" value={stats.concluidos} hint={`${stats.taxaConclusao}% taxa atual`} icon={CheckCircle2} tone="primary" />
        <StatCard label="PRIOR. ALTA" value={stats.prioridadeAlta} hint="Requer atenção" icon={TrendingUp} tone="warning" />
        <StatCard label="PRAZO CRÍTICO" value={stats.prazoCritico} hint="Prazo vencido" icon={AlertTriangle} tone="destructive" />
        <StatCard label="RÉU PRESO" value={stats.reuPreso} hint="Casos com prisão" icon={Shield} tone="purple" />
        <StatCard label="MED. PROTETIVAS" value={stats.medidasProtetivas} hint="Ativas" icon={Gavel} tone="warning" />
      </div>

      {error ? (
        <Panel title="ERRO DE CARREGAMENTO" accent="destructive" icon={<AlertOctagon className="h-4 w-4 text-destructive" />}>
          <p className="text-sm text-destructive">{error}</p>
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="ALERTAS CRÍTICOS" accent="destructive" icon={<AlertOctagon className="h-4 w-4 text-destructive" />}>
          <ul className="space-y-3">
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Inquéritos com prazo vencido</span>
              <span className="rounded border border-destructive/30 bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">{stats.prazoCritico}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Prioridade alta</span>
              <span className="rounded border border-warning/30 bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">{stats.prioridadeAlta}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Sem atualização recente</span>
              <span className="rounded border border-info/30 bg-info/15 px-2 py-0.5 text-xs font-bold text-info">{stats.semAtualizacao}</span>
            </li>
          </ul>
        </Panel>

        <Panel title="PENDÊNCIAS POR CATEGORIA" accent="warning" icon={<Bell className="h-4 w-4 text-warning" />}>
          <ul className="space-y-3">
            {pendencias.length === 0 ? <li className="text-sm text-muted-foreground">Sem pendências críticas no momento.</li> : null}
            {pendencias.map((p) => (
              <li key={p.label} className="flex items-center justify-between gap-3">
                <span className="text-sm">{p.label}</span>
                <span className="text-sm font-bold text-warning tabular-nums">{p.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="META DE CONCLUSÃO" accent="success">
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center justify-between"><span>Procedimentos cadastrados</span><strong>{stats.total}</strong></li>
            <li className="flex items-center justify-between"><span>Concluídos</span><strong className="text-success">{stats.concluidos}</strong></li>
            <li className="flex items-center justify-between"><span>Em andamento</span><strong className="text-warning">{stats.emAndamento}</strong></li>
            <li className="flex items-center justify-between"><span>Pendências ativas</span><strong className="text-purple">{stats.prazoCritico + stats.semPrazo + stats.semAtualizacao}</strong></li>
          </ul>
          <div className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3">
            <p className="text-xs font-semibold">Taxa de conclusão atual: {stats.taxaConclusao}%</p>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <DonutPanel title="POR STATUS" data={bySituation} accent="success" />
        <DonutPanel title="POR PRIORIDADE" data={byPriority} accent="warning" />

        <Panel title="PROCEDIMENTOS POR TIPO" accent="success" action={<Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          <ul className="space-y-3.5">
            {byType.map((t) => (
              <li key={t.sigla} className="flex items-center gap-3">
                <span className="w-12 text-xs font-bold text-muted-foreground">{t.sigla}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${stats.total ? (t.total / stats.total) * 100 : 0}%` }} />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{t.total}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="CVLI — COMPARATIVO ANUAL" accent="success" className="xl:col-span-2">
          <div className="mb-3 flex items-center gap-5 text-xs">
            <Legend color={COLORS.info} label="Registros" />
            <Legend color={COLORS.success} label="Elucidados" />
            <Legend color={COLORS.foreground} label="Taxa (%)" line />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={annualCvli}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="ano" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="registros" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="elucidados" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" dataKey="taxa" stroke={COLORS.foreground} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="CVLI — RESUMO ANUAL" accent="info" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">ANO</th>
                <th className="px-4 py-3 text-right font-bold">REG</th>
                <th className="px-4 py-3 text-right font-bold">ELUC</th>
                <th className="px-4 py-3 text-right font-bold">%</th>
              </tr>
            </thead>
            <tbody>
              {annualCvli.map((r) => (
                <tr key={r.ano} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{r.ano}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.registros}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.elucidados}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-success font-semibold">{r.taxa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="ANÁLISE POR LOCALIDADE" accent="warning">
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-[10px] tracking-[0.15em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-bold">LOCALIDADE</th>
                  <th className="py-2 text-right font-bold">TOTAL</th>
                  <th className="py-2 text-right font-bold">CVLI</th>
                  <th className="py-2 text-right font-bold">ALTA</th>
                </tr>
              </thead>
              <tbody>
                {topDistricts.map((b) => (
                  <tr key={b.bairro} className="border-b border-border/50">
                    <td className="py-2.5 font-medium">{b.bairro}</td>
                    <td className="py-2.5 text-right tabular-nums">{b.total}</td>
                    <td className="py-2.5 text-right tabular-nums text-destructive">{b.cvli}</td>
                    <td className="py-2.5 text-right tabular-nums text-warning">{b.alta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="ANÁLISE POR GRAVIDADE" accent="destructive">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity} layout="vertical" margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={10} width={110} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill={COLORS.destructive} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="DISTRIBUIÇÃO POR EQUIPE" accent="success">
        <ul className="space-y-3.5">
          {byTeam.map((t) => (
            <li key={t.name} className="flex items-center gap-3">
              <span className="w-44 truncate text-xs text-muted-foreground">{t.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                {t.value} ({t.pct}%)
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-lg border border-info/20 bg-info/5 p-3 text-[11px] text-muted-foreground">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
            <Info className="h-3.5 w-3.5 text-info" /> Insight automático
          </div>
          <p>
            <Link to="/cases" className="font-semibold text-success hover:underline">
              Ver lista completa de inquéritos por equipe
            </Link>
          </p>
        </div>
      </Panel>
    </div>
  );
}
