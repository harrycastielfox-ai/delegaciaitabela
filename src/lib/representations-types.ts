export type TriState = 'sim' | 'nao' | 'parcial';

export type RepresentationStatus =
  | 'em_analise'
  | 'aguardando_analise_judicial'
  | 'deferida'
  | 'indeferida'
  | 'cumprida_parcial'
  | 'cumprida_total'
  | 'arquivada';

export interface JudicialRepresentation {
  id: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
  ppeLinked: string;
  victim?: string;
  targetName?: string;
  representationDate: string;
  representationType: string;
  judicialProcessNumber?: string;
  courtBranch?: string;
  deferimentoStatus: TriState;
  deferimentoDate?: string;
  grantedDeadlineDays?: number;
  dueDate?: string;
  complianceStatus: TriState;
  complianceDate?: string;
  responsibleTeam?: string;
  diligenceResult?: string;
  notes?: string;
  status: RepresentationStatus;
  sourceImportRef?: string;
}

export interface RepresentationCreatePayload {
  ppeLinked: string;
  victim?: string;
  targetName?: string;
  representationDate: string;
  representationType: string;
  judicialProcessNumber?: string;
  courtBranch?: string;
  deferimentoStatus: TriState;
  deferimentoDate?: string;
  grantedDeadlineDays?: number;
  dueDate?: string;
  complianceStatus: TriState;
  complianceDate?: string;
  responsibleTeam?: string;
  diligenceResult?: string;
  notes?: string;
  status: RepresentationStatus;
  sourceImportRef?: string;
}

export type RepresentationUpdatePayload = Partial<RepresentationCreatePayload>;

export interface RepresentationDashboardStats {
  total: number;
  deferimentoRate: number;
  totalCumpridas: number;
  totalIndeferidas: number;
  byType: Array<{
    type: string;
    total: number;
    deferidas: number;
    cumpridas: number;
    successRate: number;
  }>;
  byStatus: Array<{
    status: RepresentationStatus;
    total: number;
  }>;
}
