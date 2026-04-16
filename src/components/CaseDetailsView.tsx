import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, FileDown, Clock, Shield, Users, MapPin,
  Scale, FileText, AlertTriangle, User, Calendar, Route,
} from 'lucide-react';
import {
  getAuditLogs,
  getCaseById,
  isCaseNoDeadline,
  isCaseNoRecentUpdate,
  isCaseOverdue,
  updateCase,
} from '@/lib/cases-repository';
import type { AuditEntry, InvestigationCase } from '@/lib/types';
import { PriorityBadge, SituationBadge, SeverityBadge } from './CaseListView';
import { generateCasePDF } from '@/lib/pdf-generator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

function toDateOnly(value?: string | null): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function toInvestigationCase(row: any): InvestigationCase {
  const createdAt = toDateOnly(row.created_at);
  const updatedAt = toDateOnly(row.updated_at) || createdAt;
  const daysElapsed = createdAt
    ? Math.max(0, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    id: row.id,
    ppe: row.ppe ?? '',
    physicalNumber: row.physical_number ?? '',
    priority: row.priority ?? 'Média',
    createdAt,
    deadline: toDateOnly(row.deadline),
    daysElapsed,
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

function toAuditEntry(row: any): AuditEntry {
  return {
    id: row.id,
    caseId: row.case_id ?? row.caseId ?? '',
    timestamp: row.timestamp ?? row.created_at ?? new Date().toISOString(),
    user: row.user ?? row.user_name ?? row.actor ?? 'Sistema',
    action: row.action ?? 'Atualização',
    field: row.field ?? '',
    oldValue: row.old_value ?? row.oldValue ?? '',
    newValue: row.new_value ?? row.newValue ?? '',
  };
}

function DetailField({ label, value }: { label: string; value?: string | number | boolean }) {
  if (value === undefined || value === null || value === '' || value === false) return null;
  const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value);
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{display}</p>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="section-card-header">
      <Icon className="h-4 w-4" />
      {title}
    </div>
  );
}

export function CaseDetailsView({ caseId }: { caseId: string }) {
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementSituation, setMovementSituation] = useState('');
  const [movementDiligenceStatus, setMovementDiligenceStatus] = useState('');
  const [movementObservations, setMovementObservations] = useState('');
  const [movementPendingActions, setMovementPendingActions] = useState('');
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadCaseDetails = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const [rawCase, rawAudit] = await Promise.all([
        getCaseById(caseId),
        getAuditLogs(caseId),
      ]);

      setCaseData(rawCase ? toInvestigationCase(rawCase) : null);
      setAuditEntries((rawAudit ?? []).map(toAuditEntry));
      if (!rawCase) setNotFound(true);
    } catch (err: any) {
      if (err?.code === 'PGRST116') {
        setNotFound(true);
        setCaseData(null);
        setAuditEntries([]);
      } else {
        console.error('Erro ao carregar detalhes do caso:', err);
        setError('Não foi possível carregar os detalhes do inquérito.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseDetails();
  }, [caseId]);

  const caseAlerts = useMemo(() => {
    if (!caseData) return [] as Array<{ id: string; message: string; severity: 'high' | 'medium' | 'low' }>;

    const alerts = [] as Array<{ id: string; message: string; severity: 'high' | 'medium' | 'low' }>;

    if (isCaseOverdue(caseData)) {
      alerts.push({ id: 'overdue', message: 'Prazo vencido', severity: 'high' });
    }
    if (isCaseNoDeadline(caseData)) {
      alerts.push({ id: 'no-deadline', message: 'Sem prazo definido', severity: 'low' });
    }
    if (isCaseNoRecentUpdate(caseData)) {
      alerts.push({ id: 'no-update', message: 'Sem atualização há mais de 15 dias', severity: 'medium' });
    }

    return alerts;
  }, [caseData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="h-12 w-12 text-muted-foreground/20" />
        <p className="mt-4 text-muted-foreground">Carregando detalhes do caso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="h-12 w-12 text-destructive/40" />
        <p className="mt-4 text-destructive">{error}</p>
        <button onClick={loadCaseDetails} className="mt-4 text-sm font-semibold text-primary hover:underline">Tentar novamente</button>
      </div>
    );
  }

  if (notFound || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="h-12 w-12 text-muted-foreground/20" />
        <p className="mt-4 text-muted-foreground">Caso não encontrado.</p>
        <Link to="/cases" className="mt-4 text-sm font-semibold text-primary hover:underline">Voltar à lista</Link>
      </div>
    );
  }

  const c = caseData;
  const isOverdue = isCaseOverdue(c);

  const openMovementModal = () => {
    setMovementSituation(c.situation);
    setMovementDiligenceStatus(c.diligenceStatus);
    setMovementObservations(c.observations);
    setMovementPendingActions(c.pendingActions);
    setMovementError(null);
    setMovementOpen(true);
  };

  const handleSaveMovement = async () => {
    setMovementSaving(true);
    setMovementError(null);

    try {
      await updateCase(c.id, {
        situation: movementSituation,
        diligence_status: movementDiligenceStatus,
        observations: movementObservations || null,
        pending_actions: movementPendingActions || null,
      });
      setMovementOpen(false);
      await loadCaseDetails();
    } catch (err) {
      console.error('Erro ao salvar movimentação:', err);
      setMovementError('Não foi possível salvar a movimentação.');
    } finally {
      setMovementSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate({ to: '/cases' })} className="btn-secondary mt-1 py-2 px-2.5">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{c.ppe}</h1>
              {isOverdue && (
                <span className="badge-critical rounded-full px-2.5 py-0.5 text-[9px] font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> VENCIDO
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{c.crimeClassification}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Última edição por <strong className="text-foreground">{c.updatedBy}</strong></span>
              <span>·</span>
              <Calendar className="h-3 w-3" />
              <span>{c.updatedAt}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generateCasePDF(c)} className="btn-secondary">
            <FileDown className="h-4 w-4" /> Gerar PDF
          </button>
          <button onClick={openMovementModal} className="btn-secondary">
            <Route className="h-4 w-4" /> Movimentar
          </button>
          <Link to="/cases/$caseId/edit" params={{ caseId: c.id }} className="btn-primary">
            <Edit className="h-4 w-4" /> Editar
          </Link>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <PriorityBadge priority={c.priority} />
        <SituationBadge situation={c.situation} />
        <SeverityBadge severity={c.severity} />
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground border border-border">{c.type}</span>
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground border border-border">{c.diligenceStatus}</span>
      </div>

      {/* Case Alerts */}
      {caseAlerts.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">Alertas deste caso ({caseAlerts.length})</span>
          </div>
          <div className="space-y-1.5">
            {caseAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${a.severity === 'high' ? 'bg-destructive' : a.severity === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                <span className="text-xs text-foreground">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* General */}
        <div className="section-card">
          <SectionHeader title="Dados Gerais" icon={FileText} />
          <div className="grid grid-cols-2 gap-5">
            <DetailField label="Nº PPE" value={c.ppe} />
            <DetailField label="Nº Físico" value={c.physicalNumber} />
            <DetailField label="Data Criação" value={c.createdAt} />
            <DetailField label="Prazo" value={c.deadline} />
            <DetailField label="Dias Decorridos" value={c.daysElapsed} />
          </div>
        </div>

        {/* Classification */}
        <div className="section-card">
          <SectionHeader title="Classificação" icon={Scale} />
          <div className="grid grid-cols-2 gap-5">
            <DetailField label="Tipificação" value={c.crimeClassification} />
            <DetailField label="Gravidade" value={c.severity} />
            <DetailField label="Tipo" value={c.type} />
            <DetailField label="Prioridade" value={c.priority} />
          </div>
        </div>

        {/* People */}
        <div className="section-card">
          <SectionHeader title="Pessoas Envolvidas" icon={Users} />
          <div className="grid grid-cols-2 gap-5">
            <DetailField label="Vítima" value={c.victim} />
            <DetailField label="Suspeito" value={c.suspect} />
          </div>
        </div>

        {/* Operational */}
        <div className="section-card">
          <SectionHeader title="Dados Operacionais" icon={MapPin} />
          <div className="grid grid-cols-2 gap-5">
            <DetailField label="Equipe" value={c.team} />
            <DetailField label="Escrivão" value={c.officer} />
            <DetailField label="Bairro" value={c.location} />
            <DetailField label="Distrito" value={c.district} />
            <DetailField label="Motivação" value={c.motivation} />
            <DetailField label="Status Diligências" value={c.diligenceStatus} />
            <DetailField label="Situação" value={c.situation} />
          </div>
        </div>

        {/* Pending actions */}
        {c.pendingActions && (
          <div className="section-card lg:col-span-2">
            <SectionHeader title="Diligências Pendentes" icon={Clock} />
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{c.pendingActions}</p>
          </div>
        )}

        {/* Observations */}
        {c.observations && (
          <div className="section-card lg:col-span-2">
            <SectionHeader title="Observações" icon={FileText} />
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{c.observations}</p>
          </div>
        )}

        {/* Legal */}
        <div className="section-card lg:col-span-2">
          <SectionHeader title="Relatório e Jurídico" icon={Shield} />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <DetailField label="Medida Protetiva" value={c.protectiveMeasure} />
            <DetailField label="Nº Processo" value={c.processNumber} />
            <DetailField label="Relatório Enviado" value={c.reportSent} />
            <DetailField label="Data Envio" value={c.reportDate} />
            <DetailField label="Representações Legais" value={c.legalRepresentations} />
          </div>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="Histórico de Alterações" icon={Clock} />
          <Link to="/audit" className="text-[10px] font-semibold text-primary hover:underline">Ver auditoria completa</Link>
        </div>
        {auditEntries.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Nenhum registro de auditoria para este caso.</p>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {auditEntries.map((entry, i) => (
              <div key={entry.id} className="relative flex items-start gap-4 py-3 pl-6">
                <div className={`absolute left-0 top-4 h-3.5 w-3.5 rounded-full border-2 border-background ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{entry.user}</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-accent-foreground">{entry.action}</span>
                    {entry.field && (
                      <>
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <span className="font-medium text-primary">{entry.field}</span>
                      </>
                    )}
                  </p>
                  {entry.oldValue && entry.newValue && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <span className="line-through">{entry.oldValue}</span>
                      <span className="mx-1 text-primary">→</span>
                      <span className="text-foreground">{entry.newValue}</span>
                    </p>
                  )}
                  {!entry.oldValue && entry.newValue && (
                    <p className="mt-1 text-[11px] text-foreground">{entry.newValue}</p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{new Date(entry.timestamp).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar inquérito</DialogTitle>
            <DialogDescription>
              Atualização operacional rápida do andamento do procedimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Situação</label>
              <select
                className="form-input"
                value={movementSituation}
                onChange={(e) => setMovementSituation(e.target.value)}
                disabled={movementSaving}
              >
                <option>Instaurado</option>
                <option>Em andamento</option>
                <option>Relatado</option>
                <option>Remetido</option>
                <option>Arquivado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status diligências</label>
              <select
                className="form-input"
                value={movementDiligenceStatus}
                onChange={(e) => setMovementDiligenceStatus(e.target.value)}
                disabled={movementSaving}
              >
                <option>Pendente</option>
                <option>Em execução</option>
                <option>Concluída</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Diligências pendentes</label>
              <textarea
                className="form-input min-h-20"
                value={movementPendingActions}
                onChange={(e) => setMovementPendingActions(e.target.value)}
                disabled={movementSaving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <textarea
                className="form-input min-h-20"
                value={movementObservations}
                onChange={(e) => setMovementObservations(e.target.value)}
                disabled={movementSaving}
              />
            </div>

            {movementError && (
              <p className="text-sm text-destructive">{movementError}</p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setMovementOpen(false)}
              className="btn-secondary"
              disabled={movementSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveMovement}
              className="btn-primary"
              disabled={movementSaving}
            >
              {movementSaving ? 'Salvando...' : 'Salvar movimentação'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
