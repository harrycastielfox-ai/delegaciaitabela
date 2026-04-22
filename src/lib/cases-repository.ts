import { supabase } from '@/integrations/supabase/client';
import type { Alert, InvestigationCase, Situation } from './types';

const FINALIZED_SITUATIONS: Situation[] = ['Relatado', 'Arquivado', 'Remetido'];

function toDateOnly(value?: string | null): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function computeDaysElapsed(createdAt: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const diffMs = Date.now() - created.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function mapCaseRow(row: any): InvestigationCase {
  const createdAt = toDateOnly(row.created_at);
  const updatedAt = toDateOnly(row.updated_at) || createdAt;

  return {
    id: row.id,
    ppe: row.ppe ?? '',
    physicalNumber: row.physical_number ?? '',
    priority: row.priority ?? 'Média',
    createdAt,
    deadline: toDateOnly(row.deadline),
    daysElapsed: computeDaysElapsed(createdAt),
    crimeClassification: row.crime_classification ?? '',
    severity: row.severity ?? 'Outros',
    type: row.type ?? 'IP',
    victim: row.victim ?? '',
    suspect: row.suspect ?? '',
    team: row.team ?? '',
    officer: row.officer ?? '',
    location: row.location ?? '',
    district: row.district ?? '',
    motivation: row.motivation ?? '',
    diligenceStatus: row.diligence_status ?? 'Pendente',
    situation: row.situation ?? 'Instaurado',
    pendingActions: row.pending_actions ?? '',
    observations: row.observations ?? '',
    protectiveMeasure: row.protective_measure ?? false,
    processNumber: row.process_number ?? '',
    reportSent: row.report_sent ?? false,
    reportDate: toDateOnly(row.report_date),
    legalRepresentations: row.legal_representations ?? 0,
    updatedAt,
    updatedBy: row.updated_by ?? 'Sistema',
  };
}

interface CurrentActor {
  userId: string | null;
  userEmail: string;
  userName: string;
}

interface UpdateCaseOptions {
  auditAction?: 'Edição' | 'Movimentação';
  fieldLabels?: Record<string, string>;
}

const DEFAULT_FIELD_LABELS: Record<string, string> = {
  ppe: 'Nº PPE',
  physical_number: 'Nº Físico',
  priority: 'Prioridade',
  created_at: 'Data de Criação',
  deadline: 'Prazo',
  crime_classification: 'Tipificação',
  severity: 'Gravidade',
  type: 'Tipo',
  victim: 'Vítima',
  suspect: 'Suspeito',
  team: 'Equipe',
  officer: 'Escrivão',
  location: 'Bairro',
  district: 'Distrito',
  motivation: 'Motivação',
  diligence_status: 'Status diligências',
  situation: 'Situação',
  pending_actions: 'Diligências pendentes',
  observations: 'Observações',
  protective_measure: 'Medida protetiva',
  process_number: 'Nº processo',
  report_sent: 'Relatório enviado',
  report_date: 'Data do relatório',
  legal_representations: 'Representações legais',
};

function normalizeAuditValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

async function getCurrentActor(): Promise<CurrentActor> {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  const fallbackEmail = authUser?.email ?? 'desconhecido@sistema.local';
  const fallbackName = (authUser?.user_metadata?.full_name as string | undefined) ?? fallbackEmail;

  if (!authUser?.id) {
    return {
      userId: null,
      userEmail: fallbackEmail,
      userName: fallbackName,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', authUser.id)
    .maybeSingle();

  return {
    userId: authUser.id,
    userEmail: fallbackEmail,
    userName: profile?.full_name?.trim() || fallbackName,
  };
}

async function insertAuditLogs(entries: Array<Record<string, unknown>>) {
  if (entries.length === 0) return;
  const { error } = await supabase.from('audit_logs').insert(entries);
  if (error) throw error;
}

export function isFinalizedSituation(situation: string): boolean {
  return FINALIZED_SITUATIONS.includes(situation as Situation);
}

export function isCaseOverdue(caseData: InvestigationCase, now: Date = new Date()): boolean {
  if (!caseData.deadline || isFinalizedSituation(caseData.situation)) return false;
  const deadline = new Date(caseData.deadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline < now;
}

export function isCaseNoDeadline(caseData: InvestigationCase): boolean {
  return !caseData.deadline && !isFinalizedSituation(caseData.situation);
}

export function isCaseNoRecentUpdate(
  caseData: InvestigationCase,
  now: Date = new Date(),
  thresholdDays = 15,
): boolean {
  if (isFinalizedSituation(caseData.situation)) return false;

  const reference = caseData.updatedAt || caseData.createdAt;
  if (!reference) return false;

  const lastUpdate = new Date(reference);
  if (Number.isNaN(lastUpdate.getTime())) return false;

  const diffMs = now.getTime() - lastUpdate.getTime();
  const daysSinceUpdate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return daysSinceUpdate > thresholdDays;
}

function daysUntil(targetDate: string, now: Date): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function buildCaseAlerts(cases: InvestigationCase[], now: Date = new Date()): Alert[] {
  const alerts: Alert[] = [];

  cases.forEach((caseData) => {
    if (isFinalizedSituation(caseData.situation)) return;

    const deadlineDiffDays = daysUntil(caseData.deadline, now);
    if (deadlineDiffDays !== null) {
      if (deadlineDiffDays < 0) {
        alerts.push({
          id: `alert-overdue-${caseData.id}`,
          caseId: caseData.id,
          casePpe: caseData.ppe,
          type: 'overdue',
          message: `Prazo vencido há ${Math.abs(deadlineDiffDays)} dias`,
          severity: 'high',
          createdAt: now.toISOString(),
        });
      } else if (deadlineDiffDays <= 2) {
        alerts.push({
          id: `alert-near2-${caseData.id}`,
          caseId: caseData.id,
          casePpe: caseData.ppe,
          type: 'near_deadline',
          message: `Prazo vence em ${deadlineDiffDays} dia(s) — URGENTE`,
          severity: 'high',
          createdAt: now.toISOString(),
        });
      } else if (deadlineDiffDays <= 5) {
        alerts.push({
          id: `alert-near5-${caseData.id}`,
          caseId: caseData.id,
          casePpe: caseData.ppe,
          type: 'near_deadline',
          message: `Prazo vence em ${deadlineDiffDays} dias`,
          severity: 'medium',
          createdAt: now.toISOString(),
        });
      }
    } else {
      alerts.push({
        id: `alert-nodl-${caseData.id}`,
        caseId: caseData.id,
        casePpe: caseData.ppe,
        type: 'no_deadline',
        message: 'Sem prazo definido',
        severity: 'low',
        createdAt: now.toISOString(),
      });
    }

    if (isCaseNoRecentUpdate(caseData, now, 30)) {
      const reference = caseData.updatedAt || caseData.createdAt;
      const daysSinceUpdate = Math.ceil((now.getTime() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `alert-noupd-critical-${caseData.id}`,
        caseId: caseData.id,
        casePpe: caseData.ppe,
        type: 'no_update',
        message: `Sem atualização há ${daysSinceUpdate} dias — CRÍTICO`,
        severity: 'high',
        createdAt: now.toISOString(),
      });
    } else if (isCaseNoRecentUpdate(caseData, now, 15)) {
      const reference = caseData.updatedAt || caseData.createdAt;
      const daysSinceUpdate = Math.ceil((now.getTime() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `alert-noupd-${caseData.id}`,
        caseId: caseData.id,
        casePpe: caseData.ppe,
        type: 'no_update',
        message: `Sem atualização há ${daysSinceUpdate} dias`,
        severity: 'medium',
        createdAt: now.toISOString(),
      });
    }
  });

  const severityRank = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export async function listCases(): Promise<InvestigationCase[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapCaseRow);
}

export async function getCaseById(id: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCase(payload: any) {
  const actor = await getCurrentActor();
  const payloadWithActor = {
    ...payload,
    // `updated_by` na tabela `cases` é UUID; usar sempre o ID do usuário autenticado.
    ...(actor.userId ? { updated_by: actor.userId } : {}),
  };

  const { data, error } = await supabase
    .from('cases')
    .insert([payloadWithActor])
    .select()
    .single();

  if (error) throw error;

  await insertAuditLogs([
    {
      case_id: data.id,
      user_id: actor.userId,
      user_email: actor.userEmail,
      user_name: actor.userName,
      action: 'Criação',
      field: null,
      old_value: null,
      new_value: 'Caso registrado no sistema',
    },
  ]);

  return data;
}

export async function updateCase(id: string, payload: any, options?: UpdateCaseOptions) {
  const actor = await getCurrentActor();
  const { data: previous, error: previousError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (previousError) throw previousError;

  const payloadWithActor = {
    ...payload,
    // `updated_by` na tabela `cases` é UUID; usar sempre o ID do usuário autenticado.
    ...(actor.userId ? { updated_by: actor.userId } : {}),
  };

  const { data, error } = await supabase
    .from('cases')
    .update(payloadWithActor)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const fieldLabels = { ...DEFAULT_FIELD_LABELS, ...(options?.fieldLabels ?? {}) };
  const action = options?.auditAction ?? 'Edição';

  const auditRows = Object.entries(payload).reduce<Array<Record<string, unknown>>>((acc, [field, newRaw]) => {
    const oldRaw = previous[field];
    const oldValue = normalizeAuditValue(oldRaw);
    const newValue = normalizeAuditValue(newRaw);
    if (oldValue === newValue) return acc;

    acc.push({
      case_id: id,
      user_id: actor.userId,
      user_email: actor.userEmail,
      user_name: actor.userName,
      action,
      field: fieldLabels[field] ?? field,
      old_value: oldValue || null,
      new_value: newValue || null,
    });
    return acc;
  }, []);

  if (auditRows.length === 0) {
    auditRows.push({
      case_id: id,
      user_id: actor.userId,
      user_email: actor.userEmail,
      user_name: actor.userName,
      action,
      field: null,
      old_value: null,
      new_value: 'Sem alterações de valor',
    });
  }

  await insertAuditLogs(auditRows);
  return data;
}

export async function getAuditLogs(caseId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function listAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}