import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, ChevronDown, ChevronLeft, ChevronRight, X, AlertTriangle, CalendarOff, FileText, RefreshCw } from 'lucide-react';
import { Link, useSearch } from '@tanstack/react-router';
import {
  isCaseNoDeadline,
  isCaseNoRecentUpdate,
  isCaseOverdue,
  isFinalizedSituation,
  listCases,
} from '@/lib/cases-repository';
import type { InvestigationCase, Priority, Severity, Situation } from '@/lib/types';

function PriorityBadge({ priority }: { priority: Priority }) {
  const cls = priority === 'Alta' ? 'badge-high' : priority === 'Média' ? 'badge-medium' : 'badge-low';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>{priority}</span>;
}

function SituationBadge({ situation }: { situation: Situation }) {
  const colors: Record<Situation, string> = {
    Instaurado: 'bg-chart-2/12 text-chart-2 border border-chart-2/20',
    'Em andamento': 'bg-warning/12 text-warning border border-warning/20',
    Relatado: 'bg-primary/12 text-primary border border-primary/20',
    Remetido: 'bg-chart-5/12 text-chart-5 border border-chart-5/20',
    Arquivado: 'bg-muted-foreground/12 text-muted-foreground border border-muted-foreground/20',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${colors[situation]}`}>{situation}</span>;
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const isCVLI = severity === 'CVLI';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${isCVLI ? 'badge-critical' : 'bg-secondary text-secondary-foreground border border-border'}`}>
      {severity}
    </span>
  );
}

const PAGE_SIZE = 10;

function isTruthy(value?: string) {
  return value === 'true';
}

export function CaseListView() {
  const searchParams = useSearch({ from: '/cases/' });

  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | ''>('');
  const [filterSituation, setFilterSituation] = useState<Situation | ''>('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [filterNoDeadline, setFilterNoDeadline] = useState(false);
  const [filterNoUpdate, setFilterNoUpdate] = useState(false);
  const [filterFinalized, setFilterFinalized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const loadCases = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listCases();
      setCases(data);
    } catch (err) {
      console.error('Erro ao carregar inquéritos:', err);
      setError('Não foi possível carregar a listagem de inquéritos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    const incomingSituation = (searchParams.situation as Situation | undefined) ?? '';
    const incomingPriority = (searchParams.priority as Priority | undefined) ?? '';

    setFilterSituation(incomingSituation);
    setFilterPriority(incomingPriority);
    setFilterOverdueOnly(isTruthy(searchParams.overdue));
    setFilterNoDeadline(isTruthy(searchParams.noDeadline));
    setFilterNoUpdate(isTruthy(searchParams.noUpdate));
    setFilterFinalized(isTruthy(searchParams.finalized));
    setPage(1);
  }, [searchParams]);

  const teams = useMemo(() => [...new Set(cases.map((c) => c.team).filter(Boolean))].sort(), [cases]);

  const caseAlertMap = useMemo(() => {
    const m = new Map<string, number>();

    cases.forEach((c) => {
      let count = 0;
      if (isCaseOverdue(c)) count += 1;
      if (isCaseNoDeadline(c)) count += 1;
      if (isCaseNoRecentUpdate(c)) count += 1;
      if (count > 0) m.set(c.id, count);
    });

    return m;
  }, [cases]);

  const activeFilterCount = [
    filterPriority,
    filterSeverity,
    filterSituation,
    filterTeam,
    filterOverdueOnly,
    filterNoDeadline,
    filterNoUpdate,
    filterFinalized,
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.ppe.toLowerCase().includes(q) ||
        c.victim.toLowerCase().includes(q) ||
        c.suspect.toLowerCase().includes(q);
      const matchesPriority = !filterPriority || c.priority === filterPriority;
      const matchesSeverity = !filterSeverity || c.severity === filterSeverity;
      const matchesSituation = !filterSituation || c.situation === filterSituation;
      const matchesTeam = !filterTeam || c.team === filterTeam;
      const matchesOverdue = !filterOverdueOnly || isCaseOverdue(c);
      const matchesNoDeadline = !filterNoDeadline || isCaseNoDeadline(c);
      const matchesNoUpdate = !filterNoUpdate || isCaseNoRecentUpdate(c);
      const matchesFinalized = !filterFinalized || isFinalizedSituation(c.situation);

      return (
        matchesSearch &&
        matchesPriority &&
        matchesSeverity &&
        matchesSituation &&
        matchesTeam &&
        matchesOverdue &&
        matchesNoDeadline &&
        matchesNoUpdate &&
        matchesFinalized
      );
    });
  }, [
    cases,
    search,
    filterPriority,
    filterSeverity,
    filterSituation,
    filterTeam,
    filterOverdueOnly,
    filterNoDeadline,
    filterNoUpdate,
    filterFinalized,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const clearFilters = () => {
    setFilterPriority('');
    setFilterSeverity('');
    setFilterSituation('');
    setFilterTeam('');
    setFilterOverdueOnly(false);
    setFilterNoDeadline(false);
    setFilterNoUpdate(false);
    setFilterFinalized(false);
    setPage(1);
  };

  const selectCls = 'h-9 rounded-md border border-border bg-input px-3 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Inquéritos</h1>
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} de {cases.length} caso(s) encontrado(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadCases} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <Link to="/register" className="btn-primary">
            + Novo Caso
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={loadCases} className="mt-2 text-xs font-semibold underline">Tentar novamente</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por PPE, vítima ou suspeito..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary relative ${showFilters ? 'border-primary/30 bg-accent' : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 alert-badge text-[8px]">{activeFilterCount}</span>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="section-card flex flex-wrap items-center gap-3">
                <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value as Priority | ''); setPage(1); }} className={selectCls}>
                  <option value="">Prioridade</option>
                  <option>Baixa</option><option>Média</option><option>Alta</option>
                </select>
                <select value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value as Severity | ''); setPage(1); }} className={selectCls}>
                  <option value="">Gravidade</option>
                  <option>CVLI</option><option>CVP</option><option>Patrimonial</option><option>Drogas</option><option>Outros</option>
                </select>
                <select value={filterSituation} onChange={(e) => { setFilterSituation(e.target.value as Situation | ''); setPage(1); }} className={selectCls}>
                  <option value="">Situação</option>
                  <option>Instaurado</option><option>Em andamento</option><option>Relatado</option><option>Remetido</option><option>Arquivado</option>
                </select>
                <select value={filterTeam} onChange={(e) => { setFilterTeam(e.target.value); setPage(1); }} className={selectCls}>
                  <option value="">Equipe</option>
                  {teams.map((t) => <option key={t}>{t}</option>)}
                </select>

                <div className="h-6 w-px bg-border" />

                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={filterFinalized} onChange={(e) => { setFilterFinalized(e.target.checked); setPage(1); }} className="h-3.5 w-3.5 rounded border-border bg-input accent-primary" />
                  <span className="text-xs text-foreground">Finalizados</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={filterOverdueOnly} onChange={(e) => { setFilterOverdueOnly(e.target.checked); setPage(1); }} className="h-3.5 w-3.5 rounded border-border bg-input accent-primary" />
                  <span className="text-xs text-foreground">Vencidos</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={filterNoDeadline} onChange={(e) => { setFilterNoDeadline(e.target.checked); setPage(1); }} className="h-3.5 w-3.5 rounded border-border bg-input accent-primary" />
                  <span className="text-xs text-foreground">Sem prazo</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={filterNoUpdate} onChange={(e) => { setFilterNoUpdate(e.target.checked); setPage(1); }} className="h-3.5 w-3.5 rounded border-border bg-input accent-primary" />
                  <span className="text-xs text-foreground">Sem atualização</span>
                </label>

                {activeFilterCount > 0 && (
                  <>
                    <div className="h-6 w-px bg-border" />
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                      <X className="h-3 w-3" /> Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">PPE</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Tipificação</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Vítima</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Prioridade</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Gravidade</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Situação</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Equipe</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Prazo</th>
              <th className="w-10 px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => {
              const isOverdue = isCaseOverdue(c);
              const alertCount = caseAlertMap.get(c.id) || 0;
              return (
                <tr key={c.id} className={`data-table-row ${isOverdue ? 'bg-destructive/[0.03]' : ''}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {isOverdue && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      {!c.deadline && !isFinalizedSituation(c.situation) && <CalendarOff className="h-3 w-3 text-chart-5" />}
                      <span className="font-mono text-[11px] font-semibold text-primary">{c.ppe}</span>
                      {alertCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/15 px-1 text-[8px] font-bold text-destructive">{alertCount}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-foreground">{c.crimeClassification}</td>
                  <td className="px-4 py-3.5 text-xs text-foreground">{c.victim}</td>
                  <td className="px-4 py-3.5"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3.5"><SeverityBadge severity={c.severity} /></td>
                  <td className="px-4 py-3.5"><SituationBadge situation={c.situation} /></td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{(c.team || 'Sem equipe').split(' - ')[0]}</td>
                  <td className={`px-4 py-3.5 text-xs ${isOverdue ? 'font-bold text-destructive' : c.deadline ? 'text-muted-foreground' : 'text-chart-5 italic'}`}>
                    {c.deadline || 'Sem prazo'}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link to="/cases/$caseId" params={{ caseId: c.id }} className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20">
                      <Eye className="h-3 w-3" /> Abrir
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">Nenhum inquérito encontrado com os filtros aplicados.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">Carregando inquéritos...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="btn-secondary py-1.5 px-2.5 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                  p === currentPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="btn-secondary py-1.5 px-2.5 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { PriorityBadge, SituationBadge, SeverityBadge };
