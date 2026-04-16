import { supabase } from '@/integrations/supabase/client';
import type { InvestigationCase, Situation } from './types';

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
  const { data, error } = await supabase
    .from('cases')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCase(id: string, payload: any) {
  const { data, error } = await supabase
    .from('cases')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
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
