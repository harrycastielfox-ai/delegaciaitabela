import type { InvestigationCase, AuditEntry, Alert } from './types';

export const dummyCases: InvestigationCase[] = [
  {
    id: '1', ppe: '001/2025-DPPC', physicalNumber: '2025.001.0001',
    priority: 'Alta', createdAt: '2025-01-15', deadline: '2025-04-15',
    daysElapsed: 89, crimeClassification: 'Homicídio Qualificado',
    severity: 'CVLI', type: 'IP', victim: 'João Carlos Silva',
    suspect: 'Marcos Antônio Ferreira', team: 'DHPP - Equipe Alpha',
    officer: 'Del. Ricardo Santos', location: 'Boa Vista', district: '1º DP',
    motivation: 'Disputa territorial', diligenceStatus: 'Em execução',
    situation: 'Em andamento', pendingActions: 'Aguardando laudo pericial do IML; Oitiva de testemunha ocular',
    observations: 'Câmeras de segurança do estabelecimento vizinho foram apreendidas. Material encaminhado para análise.',
    protectiveMeasure: true, processNumber: '0001234-55.2025.8.17.0001',
    reportSent: false, reportDate: '', legalRepresentations: 2,
    updatedAt: '2025-04-10', updatedBy: 'Del. Ricardo Santos',
  },
  {
    id: '2', ppe: '002/2025-DPPC', physicalNumber: '2025.001.0002',
    priority: 'Alta', createdAt: '2025-02-03', deadline: '2025-05-03',
    daysElapsed: 70, crimeClassification: 'Latrocínio',
    severity: 'CVLI', type: 'IP', victim: 'Maria Aparecida Oliveira',
    suspect: 'Desconhecido', team: 'DHPP - Equipe Bravo',
    officer: 'Del. Fernanda Lima', location: 'Centro', district: '2º DP',
    motivation: 'Roubo seguido de morte', diligenceStatus: 'Pendente',
    situation: 'Em andamento', pendingActions: 'Reconhecimento fotográfico; Análise de DNA',
    observations: 'Vítima foi abordada ao sair do banco. Possível envolvimento de quadrilha.',
    protectiveMeasure: false, processNumber: '',
    reportSent: false, reportDate: '', legalRepresentations: 1,
    updatedAt: '2025-03-28', updatedBy: 'Del. Fernanda Lima',
  },
  {
    id: '3', ppe: '003/2025-DPPC', physicalNumber: '2025.002.0001',
    priority: 'Média', createdAt: '2025-01-20', deadline: '2025-04-20',
    daysElapsed: 84, crimeClassification: 'Roubo Majorado',
    severity: 'Patrimonial', type: 'IP', victim: 'Pedro Henrique Costa',
    suspect: 'Lucas Gabriel Souza', team: 'DRFR - Equipe 1',
    officer: 'Del. André Moreira', location: 'Madalena', district: '3º DP',
    motivation: 'Financeira', diligenceStatus: 'Concluída',
    situation: 'Relatado', pendingActions: '',
    observations: 'Inquérito concluído. Relatório final encaminhado ao MP.',
    protectiveMeasure: false, processNumber: '0005678-90.2025.8.17.0003',
    reportSent: true, reportDate: '2025-04-05', legalRepresentations: 1,
    updatedAt: '2025-04-05', updatedBy: 'Del. André Moreira',
  },
  {
    id: '4', ppe: '004/2025-DPPC', physicalNumber: '2025.002.0002',
    priority: 'Baixa', createdAt: '2025-03-01', deadline: '2025-06-01',
    daysElapsed: 44, crimeClassification: 'Tráfico de Drogas',
    severity: 'Drogas', type: 'APF', victim: 'Estado', suspect: 'Carlos Eduardo Lima',
    team: 'DENARC - Equipe Delta', officer: 'Del. Patrícia Alves',
    location: 'Ibura', district: '4º DP', motivation: 'Tráfico ilícito',
    diligenceStatus: 'Em execução', situation: 'Em andamento',
    pendingActions: 'Interceptação telefônica autorizada; Monitoramento de endereços',
    observations: 'Operação em curso. Sigilo judicial decretado.',
    protectiveMeasure: false, processNumber: '',
    reportSent: false, reportDate: '', legalRepresentations: 0,
    updatedAt: '2025-04-12', updatedBy: 'Del. Patrícia Alves',
  },
  {
    id: '5', ppe: '005/2025-DPPC', physicalNumber: '2025.003.0001',
    priority: 'Alta', createdAt: '2025-02-10', deadline: '2025-03-10',
    daysElapsed: 63, crimeClassification: 'Lesão Corporal Grave',
    severity: 'CVP', type: 'TC', victim: 'Ana Beatriz Mendes',
    suspect: 'Roberto Silva Neto', team: 'DEAM - Equipe 1',
    officer: 'Del. Carla Rodrigues', location: 'Pina', district: '5º DP',
    motivation: 'Violência doméstica', diligenceStatus: 'Pendente',
    situation: 'Em andamento',
    pendingActions: 'Medida protetiva solicitada; Exame de corpo de delito pendente',
    observations: 'Vítima em situação de vulnerabilidade. Encaminhada a abrigo institucional.',
    protectiveMeasure: true, processNumber: '0009876-12.2025.8.17.0005',
    reportSent: false, reportDate: '', legalRepresentations: 3,
    updatedAt: '2025-04-01', updatedBy: 'Del. Carla Rodrigues',
  },
  {
    id: '6', ppe: '006/2025-DPPC', physicalNumber: '2025.003.0002',
    priority: 'Média', createdAt: '2025-03-15', deadline: '2025-06-15',
    daysElapsed: 30, crimeClassification: 'Estelionato',
    severity: 'Patrimonial', type: 'IP', victim: 'Empresa XYZ Ltda',
    suspect: 'Fernando Augusto Pereira', team: 'DEIC - Equipe 2',
    officer: 'Del. Marcos Vinícius', location: 'Espinheiro', district: '6º DP',
    motivation: 'Financeira / Fraude', diligenceStatus: 'Em execução',
    situation: 'Em andamento',
    pendingActions: 'Quebra de sigilo bancário; Análise documental',
    observations: 'Prejuízo estimado em R$ 450.000,00. Múltiplas vítimas identificadas.',
    protectiveMeasure: false, processNumber: '',
    reportSent: false, reportDate: '', legalRepresentations: 1,
    updatedAt: '2025-04-11', updatedBy: 'Del. Marcos Vinícius',
  },
  {
    id: '7', ppe: '007/2025-DPPC', physicalNumber: '2025.004.0001',
    priority: 'Alta', createdAt: '2024-11-20', deadline: '2025-02-20',
    daysElapsed: 145, crimeClassification: 'Homicídio Simples',
    severity: 'CVLI', type: 'IP', victim: 'Antônio Marcos Pereira',
    suspect: 'Não identificado', team: 'DHPP - Equipe Alpha',
    officer: 'Del. Ricardo Santos', location: 'Santo Amaro', district: '1º DP',
    motivation: 'Em apuração', diligenceStatus: 'Pendente',
    situation: 'Instaurado',
    pendingActions: 'Oitiva de testemunhas; Perícia no local do crime',
    observations: '',
    protectiveMeasure: false, processNumber: '',
    reportSent: false, reportDate: '', legalRepresentations: 0,
    updatedAt: '2025-01-15', updatedBy: 'Del. Ricardo Santos',
  },
  {
    id: '8', ppe: '008/2025-DPPC', physicalNumber: '2025.004.0002',
    priority: 'Baixa', createdAt: '2025-01-05', deadline: '2025-04-05',
    daysElapsed: 99, crimeClassification: 'Furto Qualificado',
    severity: 'Patrimonial', type: 'IP', victim: 'Supermercado Bom Preço',
    suspect: 'Grupo organizado', team: 'DRFR - Equipe 1',
    officer: 'Del. André Moreira', location: 'Aflitos', district: '3º DP',
    motivation: 'Financeira', diligenceStatus: 'Concluída',
    situation: 'Arquivado',
    pendingActions: '',
    observations: 'Caso arquivado por falta de provas suficientes para denúncia.',
    protectiveMeasure: false, processNumber: '0003456-78.2025.8.17.0003',
    reportSent: true, reportDate: '2025-03-20', legalRepresentations: 0,
    updatedAt: '2025-03-20', updatedBy: 'Del. André Moreira',
  },
  {
    id: '9', ppe: '009/2025-DPPC', physicalNumber: '2025.005.0001',
    priority: 'Média', createdAt: '2025-03-25', deadline: '2025-06-25',
    daysElapsed: 20, crimeClassification: 'Ameaça + Perseguição',
    severity: 'CVP', type: 'TC', victim: 'Juliana Cristina Barros',
    suspect: 'Ex-companheiro (Thiago Mendes)', team: 'DEAM - Equipe 1',
    officer: 'Del. Carla Rodrigues', location: 'Casa Forte', district: '5º DP',
    motivation: 'Passional', diligenceStatus: 'Em execução',
    situation: 'Em andamento',
    pendingActions: 'Coleta de provas digitais (mensagens); Depoimento do suspeito',
    observations: 'Medida protetiva de urgência deferida em 26/03/2025.',
    protectiveMeasure: true, processNumber: '0011223-44.2025.8.17.0005',
    reportSent: false, reportDate: '', legalRepresentations: 1,
    updatedAt: '2025-04-13', updatedBy: 'Del. Carla Rodrigues',
  },
  {
    id: '10', ppe: '010/2025-DPPC', physicalNumber: '2025.005.0002',
    priority: 'Alta', createdAt: '2025-04-01', deadline: '',
    daysElapsed: 13, crimeClassification: 'Organização Criminosa',
    severity: 'Outros', type: 'IP', victim: 'Sociedade', suspect: 'Facção Criminosa',
    team: 'DENARC - Equipe Delta', officer: 'Del. Patrícia Alves',
    location: 'Várzea', district: '4º DP', motivation: 'Crime organizado',
    diligenceStatus: 'Em execução', situation: 'Em andamento',
    pendingActions: 'Operação de campo planejada; Cooperação interestadual',
    observations: 'Investigação sigilosa. Dados restritos.',
    protectiveMeasure: false, processNumber: '',
    reportSent: false, reportDate: '', legalRepresentations: 0,
    updatedAt: '2025-04-14', updatedBy: 'Del. Patrícia Alves',
  },
];

export const dummyAuditLog: AuditEntry[] = [
  { id: 'a1', caseId: '1', timestamp: '2025-04-10T14:32:00', user: 'Del. Ricardo Santos', action: 'Edição', field: 'Diligências Pendentes', oldValue: 'Aguardando laudo pericial', newValue: 'Aguardando laudo pericial do IML; Oitiva de testemunha ocular' },
  { id: 'a2', caseId: '1', timestamp: '2025-04-08T09:15:00', user: 'Del. Ricardo Santos', action: 'Edição', field: 'Observações', oldValue: '', newValue: 'Câmeras de segurança do estabelecimento vizinho foram apreendidas.' },
  { id: 'a3', caseId: '5', timestamp: '2025-04-01T16:45:00', user: 'Del. Carla Rodrigues', action: 'Edição', field: 'Medida Protetiva', oldValue: 'Não', newValue: 'Sim' },
  { id: 'a4', caseId: '3', timestamp: '2025-04-05T11:20:00', user: 'Del. André Moreira', action: 'Edição', field: 'Situação', oldValue: 'Em andamento', newValue: 'Relatado' },
  { id: 'a5', caseId: '3', timestamp: '2025-04-05T11:22:00', user: 'Del. André Moreira', action: 'Edição', field: 'Relatório Enviado', oldValue: 'Não', newValue: 'Sim' },
  { id: 'a6', caseId: '2', timestamp: '2025-03-28T10:00:00', user: 'Del. Fernanda Lima', action: 'Edição', field: 'Suspeito', oldValue: 'Não identificado', newValue: 'Desconhecido' },
  { id: 'a7', caseId: '9', timestamp: '2025-04-13T08:30:00', user: 'Del. Carla Rodrigues', action: 'Criação', field: '', oldValue: '', newValue: 'Caso registrado no sistema' },
  { id: 'a8', caseId: '7', timestamp: '2025-01-15T10:00:00', user: 'Del. Ricardo Santos', action: 'Criação', field: '', oldValue: '', newValue: 'Caso registrado no sistema' },
  { id: 'a9', caseId: '10', timestamp: '2025-04-14T07:45:00', user: 'Del. Patrícia Alves', action: 'Edição', field: 'Status Diligências', oldValue: 'Pendente', newValue: 'Em execução' },
  { id: 'a10', caseId: '4', timestamp: '2025-04-12T15:10:00', user: 'Del. Patrícia Alves', action: 'Edição', field: 'Observações', oldValue: 'Operação em planejamento.', newValue: 'Operação em curso. Sigilo judicial decretado.' },
];

export function generateAlerts(cases: InvestigationCase[]): Alert[] {
  const alerts: Alert[] = [];
  const today = new Date('2025-04-14');

  cases.forEach((c) => {
    const isActive = c.situation !== 'Relatado' && c.situation !== 'Arquivado';

    // Deadline alerts
    if (c.deadline && isActive) {
      const dl = new Date(c.deadline);
      const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) {
        alerts.push({ id: `alert-overdue-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'overdue', message: `Prazo vencido há ${Math.abs(diff)} dias`, severity: 'high', createdAt: today.toISOString() });
      } else if (diff <= 2) {
        alerts.push({ id: `alert-near2-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'near_deadline', message: `Prazo vence em ${diff} dia(s) — URGENTE`, severity: 'high', createdAt: today.toISOString() });
      } else if (diff <= 5) {
        alerts.push({ id: `alert-near5-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'near_deadline', message: `Prazo vence em ${diff} dias`, severity: 'medium', createdAt: today.toISOString() });
      }
    } else if (!c.deadline && isActive) {
      alerts.push({ id: `alert-nodl-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'no_deadline', message: 'Sem prazo definido', severity: 'low', createdAt: today.toISOString() });
    }

    // No update alerts
    if (isActive) {
      const lastUpdate = new Date(c.updatedAt);
      const daysSinceUpdate = Math.ceil((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 30) {
        alerts.push({ id: `alert-noupd-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'no_update', message: `Sem atualização há ${daysSinceUpdate} dias — CRÍTICO`, severity: 'high', createdAt: today.toISOString() });
      } else if (daysSinceUpdate > 15) {
        alerts.push({ id: `alert-noupd-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'no_update', message: `Sem atualização há ${daysSinceUpdate} dias`, severity: 'medium', createdAt: today.toISOString() });
      }
    }

    // Missing data alerts
    if (c.protectiveMeasure && !c.processNumber) {
      alerts.push({ id: `alert-missing-proc-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'missing_data', message: 'Medida protetiva sem nº do processo', severity: 'high', createdAt: today.toISOString() });
    }

    // Report not sent for closed cases
    if ((c.situation === 'Relatado') && !c.reportSent) {
      alerts.push({ id: `alert-report-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'missing_data', message: 'Situação relatada mas relatório não enviado', severity: 'medium', createdAt: today.toISOString() });
    }

    // High priority without recent updates
    if (c.priority === 'Alta' && isActive) {
      const lastUpdate = new Date(c.updatedAt);
      const daysSinceUpdate = Math.ceil((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 7) {
        alerts.push({ id: `alert-hipri-${c.id}`, caseId: c.id, casePpe: c.ppe, type: 'no_update', message: `Alta prioridade sem atualização há ${daysSinceUpdate} dias`, severity: 'high', createdAt: today.toISOString() });
      }
    }
  });

  return alerts.sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}
