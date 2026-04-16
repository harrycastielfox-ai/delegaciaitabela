import { dummyCases, dummyAuditLog } from './dummy-data';
import type { InvestigationCase, AuditEntry } from './types';

let cases: InvestigationCase[] = [...dummyCases];
let auditLog: AuditEntry[] = [...dummyAuditLog];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getCases(): InvestigationCase[] {
  return cases;
}

export function getCaseById(id: string): InvestigationCase | undefined {
  return cases.find((c) => c.id === id);
}

export function addCase(data: Omit<InvestigationCase, 'id' | 'daysElapsed' | 'updatedAt' | 'updatedBy'>): InvestigationCase {
  const newCase: InvestigationCase = {
    ...data,
    id: String(Date.now()),
    daysElapsed: Math.ceil((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    updatedAt: new Date().toISOString().split('T')[0],
    updatedBy: 'Usuário atual',
  };
  cases = [newCase, ...cases];
  auditLog = [
    { id: `a-${Date.now()}`, caseId: newCase.id, timestamp: new Date().toISOString(), user: 'Usuário atual', action: 'Criação', field: '', oldValue: '', newValue: 'Caso registrado no sistema' },
    ...auditLog,
  ];
  notify();
  return newCase;
}

export function updateCase(id: string, updates: Partial<InvestigationCase>): InvestigationCase | undefined {
  const existing = cases.find((c) => c.id === id);
  if (!existing) return undefined;

  const entries: AuditEntry[] = [];
  const fieldLabels: Record<string, string> = {
    priority: 'Prioridade', situation: 'Situação', suspect: 'Suspeito',
    victim: 'Vítima', observations: 'Observações', pendingActions: 'Diligências Pendentes',
    diligenceStatus: 'Status Diligências', protectiveMeasure: 'Medida Protetiva',
    reportSent: 'Relatório Enviado', processNumber: 'Nº Processo',
  };

  for (const [key, value] of Object.entries(updates)) {
    const oldVal = (existing as any)[key];
    if (oldVal !== value) {
      entries.push({
        id: `a-${Date.now()}-${key}`,
        caseId: id,
        timestamp: new Date().toISOString(),
        user: 'Usuário atual',
        action: 'Edição',
        field: fieldLabels[key] || key,
        oldValue: String(oldVal ?? ''),
        newValue: String(value ?? ''),
      });
    }
  }

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString().split('T')[0], updatedBy: 'Usuário atual' };
  cases = cases.map((c) => (c.id === id ? updated : c));
  auditLog = [...entries, ...auditLog];
  notify();
  return updated;
}

export function getAuditLog(caseId?: string): AuditEntry[] {
  if (caseId) return auditLog.filter((e) => e.caseId === caseId);
  return auditLog;
}
