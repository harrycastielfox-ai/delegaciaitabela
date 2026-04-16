import { useSyncExternalStore, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, FileDown, Clock, Shield, Users, MapPin,
  Scale, FileText, AlertTriangle, CalendarOff, User, Calendar,
} from 'lucide-react';
import { getCaseById, getAuditLog, subscribe } from '@/lib/case-store';
import { generateAlerts } from '@/lib/dummy-data';
import { PriorityBadge, SituationBadge, SeverityBadge } from './CaseListView';
import { generateCasePDF } from '@/lib/pdf-generator';

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
  const c = useSyncExternalStore(subscribe, () => getCaseById(caseId), () => getCaseById(caseId));
  const auditEntries = useSyncExternalStore(subscribe, () => getAuditLog(caseId), () => getAuditLog(caseId));
  const navigate = useNavigate();

  const caseAlerts = useMemo(() => {
    if (!c) return [];
    return generateAlerts([c]);
  }, [c]);

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="h-12 w-12 text-muted-foreground/20" />
        <p className="mt-4 text-muted-foreground">Caso não encontrado.</p>
        <Link to="/cases" className="mt-4 text-sm font-semibold text-primary hover:underline">Voltar à lista</Link>
      </div>
    );
  }

  const isOverdue = c.deadline && new Date(c.deadline) < new Date('2025-04-14') && c.situation !== 'Relatado' && c.situation !== 'Arquivado';

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
    </motion.div>
  );
}
