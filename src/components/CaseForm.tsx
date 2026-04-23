import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, CheckCircle, Info, FileText } from 'lucide-react';
import { createCase, updateCase } from '@/lib/cases-repository';
import type { InvestigationCase, Priority, Severity, CaseType, Situation, DiligenceStatus } from '@/lib/types';

interface CaseFormProps {
  initialData?: InvestigationCase;
  mode: 'create' | 'edit';
}

const emptyForm = {
  ppe: '',
  physicalNumber: '',
  priority: 'Média' as Priority,
  dateOfFact: '',
  createdAt: new Date().toISOString().split('T')[0],
  deadline: '',
  crimeClassification: '',
  severity: 'Outros' as Severity,
  type: 'IP' as CaseType,
  victim: '',
  authorInvestigated: '',
  authorDetIndet: 'Indeterminado' as 'Determinado' | 'Indeterminado',
  defendantArrested: false,
  linkedFaction: false,
  factionName: '',
  team: '',
  officer: '',
  location: '',
  district: '',
  motivation: '',
  diligenceStatus: 'Pendente' as DiligenceStatus,
  situation: 'Instaurado' as Situation,
  pendingActions: '',
  observations: '',
  protectiveMeasure: false,
  processNumber: '',
  reportSent: false,
  reportDate: '',
  legalRepresentations: 0,
};

function FormField({
  label,
  children,
  required,
  help,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  help?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {help && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <Info className="h-2.5 w-2.5" /> {help}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card">
      <h2 className="section-card-header">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

export function CaseForm({ initialData, mode }: CaseFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...initialData,
    authorInvestigated: initialData?.authorInvestigated ?? initialData?.suspect ?? '',
    authorDetIndet: initialData?.authorDetIndet ?? 'Indeterminado',
    defendantArrested: initialData?.defendantArrested ?? false,
    linkedFaction: initialData?.linkedFaction ?? false,
    factionName: initialData?.factionName ?? '',
    dateOfFact: initialData?.dateOfFact ?? '',
  }));
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent, continueEditing = false) => {
    e.preventDefault();

    if (form.linkedFaction && !form.factionName?.trim()) {
      alert('Informe o nome da facção quando o campo "Vinculado a Facção?" estiver como Sim.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ppe: form.ppe,
        physical_number: form.physicalNumber || null,
        priority: form.priority,
        data_do_fato: form.dateOfFact || null,
        created_at: form.createdAt,
        deadline: form.deadline || null,
        crime_classification: form.crimeClassification,
        severity: form.severity,
        type: form.type,
        victim: form.victim,
        suspect: form.authorInvestigated || null,
        autor_investigado: form.authorInvestigated || null,
        autor_det_indet: form.authorDetIndet || null,
        reu_preso: form.defendantArrested,
        vinculado_faccao: form.linkedFaction,
        nome_faccao: form.linkedFaction ? (form.factionName || null) : null,
        team: form.team || null,
        officer: form.officer || null,
        location: form.location || null,
        district: form.district || null,
        motivation: form.motivation || null,
        diligence_status: form.diligenceStatus || null,
        situation: form.situation || null,
        pending_actions: form.pendingActions || null,
        observations: form.observations || null,
        protective_measure: form.protectiveMeasure,
        process_number: form.processNumber || null,
        report_sent: form.reportSent,
        report_date: form.reportDate || null,
        legal_representations: form.legalRepresentations ?? 0,
      };

      if (mode === 'create') {
        const created = await createCase(payload);

        if (continueEditing) {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        } else {
          navigate({ to: '/cases/$caseId', params: { caseId: created.id } });
        }
      } else if (initialData) {
        await updateCase(initialData.id, payload);

        if (continueEditing) {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        } else {
          navigate({ to: '/cases/$caseId', params: { caseId: initialData.id } });
        }
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar no banco.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/cases' })}
            className="btn-secondary py-2 px-2.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-extrabold tracking-tight">
                {mode === 'create' ? 'Novo Inquérito' : 'Editar Inquérito'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Registrar novo caso no sistema'
                : `Editando ${initialData?.ppe}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveState === 'saved' && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Salvo
            </motion.span>
          )}

          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, true)}
            className="btn-secondary"
            disabled={saving}
          >
            <Save className="h-4 w-4" /> Salvar e Continuar
          </button>

          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <SectionCard title="Identificação">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Nº PPE" required help="Número do Procedimento Policial Eletrônico">
            <input
              className="form-input"
              value={form.ppe}
              onChange={(e) => update('ppe', e.target.value)}
              required
              placeholder="001/2025-DPPC"
            />
          </FormField>

          <FormField label="Nº Físico" help="Número do volume físico">
            <input
              className="form-input"
              value={form.physicalNumber}
              onChange={(e) => update('physicalNumber', e.target.value)}
              placeholder="2025.001.0001"
            />
          </FormField>

          <FormField label="Data de Instauração" required>
            <input
              type="date"
              className="form-input"
              value={form.createdAt}
              onChange={(e) => update('createdAt', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Prazo" help="Data limite para conclusão">
            <input
              type="date"
              className="form-input"
              value={form.deadline}
              onChange={(e) => update('deadline', e.target.value)}
            />
          </FormField>

          <FormField label="Data do Fato">
            <input
              type="date"
              className="form-input"
              value={form.dateOfFact}
              onChange={(e) => update('dateOfFact', e.target.value)}
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Classificação">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Prioridade" required>
            <select
              className="form-input"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
            </select>
          </FormField>

          <FormField label="Gravidade" required>
            <select
              className="form-input"
              value={form.severity}
              onChange={(e) => update('severity', e.target.value)}
            >
              <option>CVLI</option>
              <option>CVP</option>
              <option>Patrimonial</option>
              <option>Drogas</option>
              <option>Outros</option>
            </select>
          </FormField>

          <FormField label="Tipo">
            <select
              className="form-input"
              value={form.type}
              onChange={(e) => update('type', e.target.value)}
            >
              <option>IP</option>
              <option>TC</option>
              <option>APF</option>
              <option>VPI</option>
            </select>
          </FormField>

          <FormField label="Tipificação" required help="Classificação penal do crime">
            <input
              className="form-input"
              value={form.crimeClassification}
              onChange={(e) => update('crimeClassification', e.target.value)}
              required
              placeholder="Ex: Homicídio Qualificado"
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Pessoas Envolvidas">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Vítima" required>
            <input
              className="form-input"
              value={form.victim}
              onChange={(e) => update('victim', e.target.value)}
              required
              placeholder="Nome completo da vítima"
            />
          </FormField>

          <FormField label="Autor/Investigado">
            <input
              className="form-input"
              value={form.authorInvestigated}
              onChange={(e) => update('authorInvestigated', e.target.value)}
              placeholder="Nome ou 'Desconhecido'"
            />
          </FormField>

          <FormField label="Réu Preso?">
            <select
              className="form-input"
              value={form.defendantArrested ? 'Sim' : 'Não'}
              onChange={(e) => update('defendantArrested', e.target.value === 'Sim')}
            >
              <option>Não</option>
              <option>Sim</option>
            </select>
          </FormField>

          <FormField label="Autor Det/Indet">
            <select
              className="form-input"
              value={form.authorDetIndet}
              onChange={(e) => update('authorDetIndet', e.target.value)}
            >
              <option>Determinado</option>
              <option>Indeterminado</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Dados Operacionais">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Equipe Responsável">
            <input
              className="form-input"
              value={form.team}
              onChange={(e) => update('team', e.target.value)}
              placeholder="Ex: DHPP - Equipe Alpha"
            />
          </FormField>

          <FormField label="Escrivão">
            <input
              className="form-input"
              value={form.officer}
              onChange={(e) => update('officer', e.target.value)}
              placeholder="Del. Nome"
            />
          </FormField>

          <FormField label="Bairro">
            <input
              className="form-input"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </FormField>

          <FormField label="Distrito">
            <input
              className="form-input"
              value={form.district}
              onChange={(e) => update('district', e.target.value)}
              placeholder="Ex: 1º DP"
            />
          </FormField>

          <FormField label="Motivação">
            <input
              className="form-input"
              value={form.motivation}
              onChange={(e) => update('motivation', e.target.value)}
            />
          </FormField>

          <FormField label="Vinculado a Facção?">
            <select
              className="form-input"
              value={form.linkedFaction ? 'Sim' : 'Não'}
              onChange={(e) => update('linkedFaction', e.target.value === 'Sim')}
            >
              <option>Não</option>
              <option>Sim</option>
            </select>
          </FormField>

          {form.linkedFaction && (
            <FormField label="Nome da Facção" required help="Obrigatório quando vinculado a facção">
              <input
                className="form-input"
                value={form.factionName}
                onChange={(e) => update('factionName', e.target.value)}
                placeholder="Informe o nome da facção"
                required
              />
            </FormField>
          )}

          <FormField label="Situação" required help="Status processual do inquérito">
            <select
              className="form-input"
              value={form.situation}
              onChange={(e) => update('situation', e.target.value)}
            >
              <option>Instaurado</option>
              <option>Em andamento</option>
              <option>Relatado</option>
              <option>Remetido</option>
              <option>Arquivado</option>
            </select>
          </FormField>

          <FormField label="Status Diligências" help="Andamento das investigações">
            <select
              className="form-input"
              value={form.diligenceStatus}
              onChange={(e) => update('diligenceStatus', e.target.value)}
            >
              <option>Pendente</option>
              <option>Em execução</option>
              <option>Concluída</option>
            </select>
          </FormField>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5">
          <FormField label="Diligências Pendentes" help="Ações investigativas aguardando execução">
            <textarea
              className="form-textarea"
              rows={3}
              value={form.pendingActions}
              onChange={(e) => update('pendingActions', e.target.value)}
              placeholder="Descreva as diligências pendentes..."
            />
          </FormField>

          <FormField label="Observações" help="Notas adicionais sobre o caso (campo livre)">
            <textarea
              className="form-textarea"
              rows={4}
              value={form.observations}
              onChange={(e) => update('observations', e.target.value)}
              placeholder="Informações complementares..."
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Relatório e Jurídico">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Medida Protetiva">
            <select
              className="form-input"
              value={form.protectiveMeasure ? 'Sim' : 'Não'}
              onChange={(e) => update('protectiveMeasure', e.target.value === 'Sim')}
            >
              <option>Não</option>
              <option>Sim</option>
            </select>
          </FormField>

          <FormField
            label="Nº Processo"
            help={form.protectiveMeasure ? 'Obrigatório com medida protetiva' : ''}
          >
            <input
              className={`form-input ${
                form.protectiveMeasure && !form.processNumber ? 'border-destructive/50' : ''
              }`}
              value={form.processNumber}
              onChange={(e) => update('processNumber', e.target.value)}
              placeholder="0001234-55.2025.8.17.0001"
            />
          </FormField>

          <FormField label="Relatório Enviado">
            <select
              className="form-input"
              value={form.reportSent ? 'Sim' : 'Não'}
              onChange={(e) => update('reportSent', e.target.value === 'Sim')}
            >
              <option>Não</option>
              <option>Sim</option>
            </select>
          </FormField>

          <FormField label="Data Envio Relatório">
            <input
              type="date"
              className="form-input"
              value={form.reportDate}
              onChange={(e) => update('reportDate', e.target.value)}
            />
          </FormField>

          <FormField label="Representações Legais">
            <input
              type="number"
              min={0}
              className="form-input"
              value={form.legalRepresentations}
              onChange={(e) => update('legalRepresentations', Number(e.target.value))}
            />
          </FormField>
        </div>
      </SectionCard>
    </motion.form>
  );
}
