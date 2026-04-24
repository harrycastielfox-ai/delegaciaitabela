import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, AlertCircle, Info, Bell, Shield, ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { buildCaseAlerts, listCases } from '@/lib/cases-repository';
import type { Alert } from '@/lib/types';

const iconMap = {
  overdue: AlertTriangle,
  near_deadline: Clock,
  no_update: AlertCircle,
  missing_data: Info,
  no_deadline: Bell,
};

const typeLabel: Record<string, string> = {
  overdue: 'Prazo Vencido',
  near_deadline: 'Prazo Próximo',
  no_update: 'Sem Atualização',
  missing_data: 'Dados Incompletos',
  no_deadline: 'Sem Prazo Definido',
};

const severityLabel: Record<string, string> = {
  high: 'Crítico',
  medium: 'Atenção',
  low: 'Informativo',
};

const severityOrder = ['high', 'medium', 'low'] as const;

function getTypeIconClass(type: string, items: Alert[]): string {
  if (type === 'overdue') return 'text-destructive';
  if (type === 'near_deadline') return 'text-warning';
  if (type === 'missing_data') return items.some((a) => a.severity === 'high') ? 'text-destructive' : 'text-warning';
  return 'text-primary';
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('');

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const cases = await listCases();
      setAlerts(buildCaseAlerts(cases));
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
      setError('Não foi possível carregar os alertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (!filterSeverity) return alerts;
    return alerts.filter((a) => a.severity === filterSeverity);
  }, [alerts, filterSeverity]);

  const countBySeverity = useMemo(() => {
    const m = { high: 0, medium: 0, low: 0 };
    alerts.forEach((a) => { m[a.severity]++; });
    return m;
  }, [alerts]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof alerts> = {};
    filteredAlerts.forEach((a) => {
      if (!g[a.type]) g[a.type] = [];
      g[a.type].push(a);
    });
    return g;
  }, [filteredAlerts]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Central de Alertas</h1>
          </div>
          <p className="text-sm text-muted-foreground">{alerts.length} alerta(s) ativo(s) no sistema</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={loadAlerts} className="mt-2 text-xs font-semibold underline">Tentar novamente</button>
        </div>
      )}

      {loading && !error && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Carregando alertas...
        </div>
      )}

      {/* Severity summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {severityOrder.map((sev) => {
          const isActive = filterSeverity === sev;
          return (
            <button
              key={sev}
              onClick={() => setFilterSeverity(isActive ? '' : sev)}
              className={`section-card text-left transition-all ${isActive ? 'border-primary/30 glow-border' : ''} hover:border-primary/20`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{severityLabel[sev]}</p>
                  <p className="mt-1 text-2xl font-extrabold text-foreground">{countBySeverity[sev]}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${sev === 'high' ? 'bg-destructive' : sev === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bell className="h-12 w-12 text-muted-foreground/20" />
          <p className="mt-4 text-muted-foreground">Nenhum alerta {filterSeverity ? 'para este filtro' : 'no momento'}.</p>
          {filterSeverity && (
            <button onClick={() => setFilterSeverity('')} className="mt-2 text-xs text-primary hover:underline">Limpar filtro</button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = iconMap[type as keyof typeof iconMap] || Bell;
            return (
              <motion.div key={type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="section-card">
                <div className="mb-4 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${getTypeIconClass(type, items)}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{typeLabel[type]}</h3>
                  <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((a) => (
                    <div key={a.id} className="group flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/70">
                      <div className={`h-2 w-2 rounded-full ${a.severity === 'high' ? 'bg-destructive' : a.severity === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                      <span className="font-mono text-[11px] font-semibold text-primary">{a.casePpe}</span>
                      <span className="flex-1 text-xs text-foreground">{a.message}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${a.severity === 'high' ? 'badge-high' : a.severity === 'medium' ? 'badge-medium' : 'badge-low'}`}>
                        {severityLabel[a.severity]}
                      </span>
                      <Link
                        to={a.type === 'missing_data' ? '/cases/edit/$caseId' : '/cases/$caseId'}
                        params={{ caseId: a.caseId }}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10"
                      >
                        {a.type === 'missing_data' ? 'Corrigir dados' : 'Abrir caso'}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
