import { supabase } from '@/integrations/supabase/client';
import type {
  JudicialRepresentation,
  RepresentationCreatePayload,
  RepresentationDashboardStats,
  RepresentationStatus,
  RepresentationUpdatePayload,
  TriState,
} from './representations-types';

function toDateOnly(value?: string | null): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function normalizeTriState(value: unknown, fallback: TriState = 'nao'): TriState {
  if (value === 'sim' || value === 'nao' || value === 'parcial') return value;
  return fallback;
}

function normalizeStatus(value: unknown): RepresentationStatus {
  const allowed: RepresentationStatus[] = [
    'em_analise',
    'aguardando_analise_judicial',
    'deferida',
    'indeferida',
    'cumprida_parcial',
    'cumprida_total',
    'arquivada',
  ];

  if (allowed.includes(value as RepresentationStatus)) {
    return value as RepresentationStatus;
  }

  return 'em_analise';
}

function mapRepresentationRow(row: any): JudicialRepresentation {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    ppeLinked: row.ppe_linked,
    victim: row.victim ?? '',
    targetName: row.target_name ?? '',
    representationDate: toDateOnly(row.representation_date),
    representationType: row.representation_type ?? '',
    judicialProcessNumber: row.judicial_process_number ?? '',
    courtBranch: row.court_branch ?? '',
    deferimentoStatus: normalizeTriState(row.deferimento_status),
    deferimentoDate: toDateOnly(row.deferimento_date),
    grantedDeadlineDays: typeof row.granted_deadline_days === 'number' ? row.granted_deadline_days : undefined,
    dueDate: toDateOnly(row.due_date),
    complianceStatus: normalizeTriState(row.compliance_status),
    complianceDate: toDateOnly(row.compliance_date),
    responsibleTeam: row.responsible_team ?? '',
    diligenceResult: row.diligence_result ?? '',
    notes: row.notes ?? '',
    status: normalizeStatus(row.status),
    sourceImportRef: row.source_import_ref ?? '',
  };
}

function toDbPayload(payload: RepresentationCreatePayload | RepresentationUpdatePayload) {
  return {
    ppe_linked: payload.ppeLinked,
    victim: payload.victim || null,
    target_name: payload.targetName || null,
    representation_date: payload.representationDate,
    representation_type: payload.representationType,
    judicial_process_number: payload.judicialProcessNumber || null,
    court_branch: payload.courtBranch || null,
    deferimento_status: payload.deferimentoStatus,
    deferimento_date: payload.deferimentoDate || null,
    granted_deadline_days:
      payload.grantedDeadlineDays === undefined || payload.grantedDeadlineDays === null
        ? null
        : payload.grantedDeadlineDays,
    due_date: payload.dueDate || null,
    compliance_status: payload.complianceStatus,
    compliance_date: payload.complianceDate || null,
    responsible_team: payload.responsibleTeam || null,
    diligence_result: payload.diligenceResult || null,
    notes: payload.notes || null,
    status: payload.status,
    source_import_ref: payload.sourceImportRef || null,
  };
}

async function getCurrentActorId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listRepresentations(): Promise<JudicialRepresentation[]> {
  const { data, error } = await supabase
    .from('representations')
    .select('*')
    .order('representation_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRepresentationRow);
}

export async function getRepresentationById(id: string): Promise<JudicialRepresentation> {
  const { data, error } = await supabase
    .from('representations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapRepresentationRow(data);
}

export async function createRepresentation(payload: RepresentationCreatePayload): Promise<JudicialRepresentation> {
  const actorId = await getCurrentActorId();
  const dbPayload = {
    ...toDbPayload(payload),
    ...(actorId ? { updated_by: actorId } : {}),
  };

  const { data, error } = await supabase
    .from('representations')
    .insert([dbPayload])
    .select('*')
    .single();

  if (error) throw error;
  return mapRepresentationRow(data);
}

export async function updateRepresentation(id: string, payload: RepresentationUpdatePayload): Promise<JudicialRepresentation> {
  const actorId = await getCurrentActorId();
  const dbPayload = {
    ...toDbPayload(payload),
    ...(actorId ? { updated_by: actorId } : {}),
  };

  const { data, error } = await supabase
    .from('representations')
    .update(dbPayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRepresentationRow(data);
}

export async function deleteRepresentation(id: string): Promise<void> {
  const { error } = await supabase
    .from('representations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getRepresentationDashboardStats(): Promise<RepresentationDashboardStats> {
  const rows = await listRepresentations();

  const total = rows.length;
  const deferidas = rows.filter((r) => r.deferimentoStatus === 'sim').length;
  const totalCumpridas = rows.filter((r) => r.complianceStatus === 'sim' || r.status === 'cumprida_total').length;
  const totalIndeferidas = rows.filter((r) => r.status === 'indeferida' || r.deferimentoStatus === 'nao').length;
  const deferimentoRate = total ? Number(((deferidas / total) * 100).toFixed(1)) : 0;

  const byTypeMap = new Map<string, { total: number; deferidas: number; cumpridas: number }>();
  rows.forEach((r) => {
    const key = r.representationType || 'Não informado';
    const curr = byTypeMap.get(key) ?? { total: 0, deferidas: 0, cumpridas: 0 };
    curr.total += 1;
    if (r.deferimentoStatus === 'sim') curr.deferidas += 1;
    if (r.complianceStatus === 'sim' || r.status === 'cumprida_total') curr.cumpridas += 1;
    byTypeMap.set(key, curr);
  });

  const byType = Array.from(byTypeMap.entries())
    .map(([type, values]) => ({
      type,
      total: values.total,
      deferidas: values.deferidas,
      cumpridas: values.cumpridas,
      successRate: values.total ? Number(((values.cumpridas / values.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const byStatusMap = new Map<RepresentationStatus, number>();
  rows.forEach((r) => {
    byStatusMap.set(r.status, (byStatusMap.get(r.status) || 0) + 1);
  });

  const byStatus = Array.from(byStatusMap.entries())
    .map(([status, count]) => ({ status, total: count }))
    .sort((a, b) => b.total - a.total);

  return {
    total,
    deferimentoRate,
    totalCumpridas,
    totalIndeferidas,
    byType,
    byStatus,
  };
}
