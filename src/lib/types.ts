export type Priority = 'Baixa' | 'Média' | 'Alta';
export type Severity = 'CVLI' | 'CVP' | 'Patrimonial' | 'Drogas' | 'Outros';
export type CaseType = 'IP' | 'TC' | 'APF' | 'VPI';
export type Situation = 'Instaurado' | 'Em andamento' | 'Relatado' | 'Remetido' | 'Arquivado';
export type DiligenceStatus = 'Pendente' | 'Em execução' | 'Concluída';

export interface InvestigationCase {
  id: string;
  ppe: string;
  physicalNumber: string;
  priority: Priority;
  prazo: number;
  dataLimit?: string;
  dateOfFact?: string;
  createdAt: string;
  deadline?: string;
  daysElapsed: number;
  
  crimeClassification: string;
  severity: Severity;
  type: CaseType;
  victim: string;
  authorInvestigated?: string;
  suspect: string;
  authorDetIndet: 'Determinado' | 'Indeterminado';
  defendantArrested: boolean;

  linkedFaction?: boolean;
  factionName?: string;

  boNumber?: string;
  investigatorResponsible?: string;

  team: string;
  officer: string;
  location: string;
  district: string;
  motivation: string;
  team: string;
  officer: string;
  location: string;
  district: string;
  motivation: string;
  diligenceStatus: DiligenceStatus;
  situation: Situation;
  pendingActions: string;
  observations: string;
  protectiveMeasure: boolean;
  processNumber: string;
  reportSent: boolean;
  reportDate: string;
  legalRepresentations: number;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditEntry {
  id: string;
  caseId: string;
  timestamp: string;
  user: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface Alert {
  id: string;
  caseId: string;
  casePpe: string;
  type: 'overdue' | 'near_deadline' | 'no_update' | 'missing_data' | 'no_deadline';
  message: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
}
