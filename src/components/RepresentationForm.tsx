import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createRepresentation, updateRepresentation } from '@/lib/representations-repository';
import type {
  JudicialRepresentation,
  RepresentationCreatePayload,
  RepresentationStatus,
  TriState,
} from '@/lib/representations-types';

type FormState = RepresentationCreatePayload;

const STATUS_OPTIONS: Array<{ value: RepresentationStatus; label: string }> = [
  { value: 'em_analise', label: 'Em análise' },
  { value: 'aguardando_analise_judicial', label: 'Aguardando análise judicial' },
  { value: 'deferida', label: 'Deferida' },
  { value: 'indeferida', label: 'Indeferida' },
  { value: 'cumprida_parcial', label: 'Cumprida parcial' },
  { value: 'cumprida_total', label: 'Cumprida total' },
  { value: 'arquivada', label: 'Arquivada' },
];

const TRI_OPTIONS: Array<{ value: TriState; label: string }> = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'parcial', label: 'Parcial' },
];

function getInitialForm(data?: JudicialRepresentation): FormState {
  if (!data) {
    return {
      ppeLinked: '',
      victim: '',
      targetName: '',
      representationDate: '',
      representationType: '',
      judicialProcessNumber: '',
      courtBranch: '',
      deferimentoStatus: 'nao',
      deferimentoDate: '',
      grantedDeadlineDays: undefined,
      dueDate: '',
      complianceStatus: 'nao',
      complianceDate: '',
      responsibleTeam: '',
      diligenceResult: '',
      notes: '',
      status: 'em_analise',
      sourceImportRef: '',
    };
  }

  return {
    ppeLinked: data.ppeLinked,
    victim: data.victim || '',
    targetName: data.targetName || '',
    representationDate: data.representationDate || '',
    representationType: data.representationType || '',
    judicialProcessNumber: data.judicialProcessNumber || '',
    courtBranch: data.courtBranch || '',
    deferimentoStatus: data.deferimentoStatus,
    deferimentoDate: data.deferimentoDate || '',
    grantedDeadlineDays: data.grantedDeadlineDays,
    dueDate: data.dueDate || '',
    complianceStatus: data.complianceStatus,
    complianceDate: data.complianceDate || '',
    responsibleTeam: data.responsibleTeam || '',
    diligenceResult: data.diligenceResult || '',
    notes: data.notes || '',
    status: data.status,
    sourceImportRef: data.sourceImportRef || '',
  };
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function RepresentationForm({ mode, initialData }: { mode: 'create' | 'edit'; initialData?: JudicialRepresentation }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(() => getInitialForm(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    if (!form.ppeLinked.trim()) return false;
    if (!form.representationDate) return false;
    if (!form.representationType.trim()) return false;
    if (!form.status) return false;
    if (form.grantedDeadlineDays !== undefined && form.grantedDeadlineDays < 0) return false;
    return true;
  }, [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Preencha os campos obrigatórios e revise os valores informados.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await createRepresentation(form);
        navigate({ to: '/representacoes/$representationId', params: { representationId: created.id } });
      } else if (initialData) {
        const updated = await updateRepresentation(initialData.id, form);
        navigate({ to: '/representacoes/$representationId', params: { representationId: updated.id } });
      }
    } catch (err) {
      console.error('Erro ao salvar representação:', err);
      setError('Não foi possível salvar a representação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === 'create' ? 'Nova Representação' : 'Editar Representação'}
          </h1>
          <p className="text-sm text-muted-foreground">Cadastro independente do módulo de inquéritos</p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate({ to: '/representacoes' })} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={!isValid || saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Salvando...' : mode === 'create' ? 'Salvar representação' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="PPE vinculado" required>
          <input value={form.ppeLinked} onChange={(e) => update('ppeLinked', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Data Representação" required>
          <input type="date" value={form.representationDate} onChange={(e) => update('representationDate', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Vítima">
          <input value={form.victim} onChange={(e) => update('victim', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Investigado/Alvo">
          <input value={form.targetName} onChange={(e) => update('targetName', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Tipo de Representação" required>
          <input value={form.representationType} onChange={(e) => update('representationType', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Processo Judicial">
          <input value={form.judicialProcessNumber} onChange={(e) => update('judicialProcessNumber', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Vara/Juízo">
          <input value={form.courtBranch} onChange={(e) => update('courtBranch', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Status" required>
          <select value={form.status} onChange={(e) => update('status', e.target.value as RepresentationStatus)} className="form-input">
            {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </FormField>

        <FormField label="Deferida?">
          <select value={form.deferimentoStatus} onChange={(e) => update('deferimentoStatus', e.target.value as TriState)} className="form-input">
            {TRI_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </FormField>

        <FormField label="Data Deferimento">
          <input type="date" value={form.deferimentoDate} onChange={(e) => update('deferimentoDate', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Prazo Concedido (dias)">
          <input
            type="number"
            min={0}
            value={form.grantedDeadlineDays ?? ''}
            onChange={(e) => update('grantedDeadlineDays', e.target.value ? Number(e.target.value) : undefined)}
            className="form-input"
          />
        </FormField>

        <FormField label="Data Vencimento">
          <input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Cumprida?">
          <select value={form.complianceStatus} onChange={(e) => update('complianceStatus', e.target.value as TriState)} className="form-input">
            {TRI_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </FormField>

        <FormField label="Data Cumprimento">
          <input type="date" value={form.complianceDate} onChange={(e) => update('complianceDate', e.target.value)} className="form-input" />
        </FormField>

        <FormField label="Equipe Responsável">
          <input value={form.responsibleTeam} onChange={(e) => update('responsibleTeam', e.target.value)} className="form-input" />
        </FormField>

        <div className="md:col-span-2">
          <FormField label="Resultado da Diligência">
            <textarea value={form.diligenceResult} onChange={(e) => update('diligenceResult', e.target.value)} className="form-input min-h-20" />
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="Observações">
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="form-input min-h-24" />
          </FormField>
        </div>
      </div>
    </form>
  );
}
