import { useState, useMemo, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { History, ArrowRight, Search, Filter, ChevronDown, FileText } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { getAuditLog, getCases, subscribe } from '@/lib/case-store';

export function AuditView() {
  const entries = useSyncExternalStore(subscribe, () => getAuditLog(), () => getAuditLog());
  const cases = useSyncExternalStore(subscribe, () => getCases(), () => getCases());
  const [filterCase, setFilterCase] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const users = useMemo(() => [...new Set(entries.map((e) => e.user))].sort(), [entries]);
  const actions = useMemo(() => [...new Set(entries.map((e) => e.action))].sort(), [entries]);

  const casePpeMap = useMemo(() => {
    const m = new Map<string, string>();
    cases.forEach((c) => m.set(c.id, c.ppe));
    return m;
  }, [cases]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterCase && e.caseId !== filterCase) return false;
      if (filterAction && e.action !== filterAction) return false;
      if (filterUser && e.user !== filterUser) return false;
      return true;
    });
  }, [entries, filterCase, filterAction, filterUser]);

  const activeFilters = [filterCase, filterAction, filterUser].filter(Boolean).length;

  const selectCls = "h-9 rounded-md border border-border bg-input px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <History className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Auditoria</h1>
        </div>
        <p className="text-sm text-muted-foreground">Histórico completo de alterações · {filtered.length} registro(s)</p>
      </div>

      {/* Filters */}
      <div className="section-card flex flex-wrap items-center gap-3">
        <select value={filterCase} onChange={(e) => setFilterCase(e.target.value)} className={selectCls}>
          <option value="">Todos os casos</option>
          {cases.map((c) => <option key={c.id} value={c.id}>{c.ppe}</option>)}
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className={selectCls}>
          <option value="">Todos os usuários</option>
          {users.map((u) => <option key={u}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className={selectCls}>
          <option value="">Todas as ações</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
        {activeFilters > 0 && (
          <button onClick={() => { setFilterCase(''); setFilterAction(''); setFilterUser(''); }} className="text-xs text-destructive hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <History className="h-12 w-12 text-muted-foreground/20" />
          <p className="mt-4 text-muted-foreground">Nenhum registro de auditoria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Data/Hora</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Caso</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Usuário</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Ação</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Campo</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Alteração</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="data-table-row">
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.timestamp).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3.5">
                    <Link to="/cases/$caseId" params={{ caseId: e.caseId }} className="font-mono text-[11px] font-semibold text-primary hover:underline">
                      {casePpeMap.get(e.caseId) || e.caseId}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-foreground">{e.user}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-[9px] font-bold text-accent-foreground">{e.action}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-foreground">{e.field || '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[300px]">
                    {e.oldValue && e.newValue ? (
                      <span className="flex items-center gap-1.5">
                        <span className="line-through truncate max-w-[120px]">{e.oldValue}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate max-w-[120px] text-foreground">{e.newValue}</span>
                      </span>
                    ) : e.newValue ? (
                      <span className="text-foreground truncate">{e.newValue}</span>
                    ) : '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
