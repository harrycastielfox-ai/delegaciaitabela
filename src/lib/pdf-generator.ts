import jsPDF from 'jspdf';
import type { InvestigationCase } from './types';

export function generateCasePDF(c: InvestigationCase) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addSection = (title: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    doc.text(title, 14, y);
    y += 2;
    doc.setDrawColor(34, 139, 34);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
  };

  const addField = (label: string, value?: string | number | boolean) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    if (y > 275) { doc.addPage(); y = 20; }
    const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const labelWidth = doc.getTextWidth(`${label}: `);
    const lines = doc.splitTextToSize(display, pageWidth - 28 - labelWidth);
    doc.text(lines, 14 + labelWidth, y);
    y += lines.length * 5 + 2;
  };

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('RELATÓRIO DE INQUÉRITO POLICIAL', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`PPE: ${c.ppe}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.line(14, y, pageWidth - 14, y);
  y += 4;

  // Key info
  doc.setFillColor(240, 248, 240);
  doc.rect(14, y, pageWidth - 28, 14, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`Prioridade: ${c.priority}`, 18, y + 5);
  doc.text(`Gravidade: ${c.severity}`, 70, y + 5);
  doc.text(`Situação: ${c.situation}`, 120, y + 5);
  doc.text(`Tipo: ${c.type}`, 170, y + 5);
  y += 18;

  addSection('IDENTIFICAÇÃO');
  addField('Nº PPE', c.ppe);
  addField('Nº Físico', c.physicalNumber);
  addField('Data de Criação', c.createdAt);
  addField('Prazo', c.deadline);
  addField('Dias Decorridos', c.daysElapsed);

  addSection('CLASSIFICAÇÃO');
  addField('Tipificação', c.crimeClassification);
  addField('Gravidade', c.severity);
  addField('Tipo', c.type);
  addField('Prioridade', c.priority);

  addSection('PESSOAS ENVOLVIDAS');
  addField('Vítima', c.victim);
  addField('Suspeito', c.suspect);

  addSection('DADOS OPERACIONAIS');
  addField('Equipe Responsável', c.team);
  addField('Escrivão', c.officer);
  addField('Bairro', c.location);
  addField('Distrito', c.district);
  addField('Motivação', c.motivation);
  addField('Status Diligências', c.diligenceStatus);
  addField('Situação', c.situation);

  if (c.pendingActions) {
    addSection('DILIGÊNCIAS PENDENTES');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(c.pendingActions, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
  }

  if (c.observations) {
    addSection('OBSERVAÇÕES');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(c.observations, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
  }

  addSection('RELATÓRIO E JURÍDICO');
  addField('Medida Protetiva', c.protectiveMeasure);
  addField('Nº Processo', c.processNumber);
  addField('Relatório Enviado', c.reportSent);
  addField('Data Envio Relatório', c.reportDate);
  addField('Representações Legais', c.legalRepresentations);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`SIPI - Sistema de Inquéritos Policiais · Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`inquerito-${c.ppe.replace(/\//g, '-')}.pdf`);
}
