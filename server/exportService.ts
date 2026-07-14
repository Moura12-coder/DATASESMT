import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';
import { storagePut } from './storage';
import * as db from './db';

/**
 * Serviço de Exportação de Relatórios e Dashboards para PDF e Excel
 */

// ─── TIPOS ───────────────────────────────────────────────────────────────────
export interface ExportOptions {
  title: string;
  subtitle?: string;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSignature?: boolean;
  format: 'pdf' | 'excel';
  period?: string;
  generatedBy?: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  data: Record<string, any>[];
  summary?: Record<string, any>;
  charts?: ChartData[];
  period?: string;
}

export interface ChartData {
  title: string;
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
  }[];
}

// ─── EXPORTAÇÃO PARA PDF ──────────────────────────────────────────────────────
export async function exportReportToPdf(
  reportData: ReportData,
  options: ExportOptions
): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { height, width } = page.getSize();

  let yPosition = height - 50;

  // Cabeçalho
  page.drawText(reportData.title, {
    x: 50,
    y: yPosition,
    size: 24,
    color: rgb(0, 51, 102),
  });
  yPosition -= 30;

  if (reportData.subtitle) {
    page.drawText(reportData.subtitle, {
      x: 50,
      y: yPosition,
      size: 14,
      color: rgb(100, 100, 100),
    });
    yPosition -= 20;
  }

  // Período
  if (reportData.period) {
    page.drawText(`Período: ${reportData.period}`, {
      x: 50,
      y: yPosition,
      size: 10,
      color: rgb(150, 150, 150),
    });
    yPosition -= 20;
  }

  // Data de geração
  page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
    x: 50,
    y: yPosition,
    size: 10,
    color: rgb(150, 150, 150),
  });
  yPosition -= 40;

  // Resumo
  if (reportData.summary) {
    page.drawText('Resumo:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 51, 102),
    });
    yPosition -= 20;

    Object.entries(reportData.summary).forEach(([key, value]) => {
      page.drawText(`${key}: ${value}`, {
        x: 70,
        y: yPosition,
        size: 10,
        color: rgb(50, 50, 50),
      });
      yPosition -= 15;
    });
    yPosition -= 20;
  }

  // Tabela de dados
  if (options.includeTables && reportData.data.length > 0) {
    page.drawText('Dados:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 51, 102),
    });
    yPosition -= 20;

    // Headers
    const headers = Object.keys(reportData.data[0]);
    const colWidth = (width - 100) / headers.length;

    headers.forEach((header, index) => {
      page.drawText(header, {
        x: 50 + index * colWidth,
        y: yPosition,
        size: 9,
        color: rgb(255, 255, 255),
      });
    });

    // Desenhar fundo do header
    const headerPage = pdfDoc.getPage(0);
    headerPage.drawRectangle({
      x: 50,
      y: yPosition - 5,
      width: width - 100,
      height: 15,
      color: rgb(0, 51, 102),
    });

    yPosition -= 25;

    // Dados
    reportData.data.slice(0, 20).forEach((row) => {
      Object.values(row).forEach((value, index) => {
        page.drawText(String(value).substring(0, 20), {
          x: 50 + index * colWidth,
          y: yPosition,
          size: 8,
          color: rgb(50, 50, 50),
        });
      });
      yPosition -= 15;

      if (yPosition < 50) {
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 792 - 50;
      }
    });
  }

  // Assinatura digital
  if (options.includeSignature) {
    yPosition -= 20;
    page.drawText('Assinado digitalmente', {
      x: 50,
      y: yPosition,
      size: 9,
      color: rgb(100, 100, 100),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

  return storagePut(`reports/${fileName}`, pdfBytes, 'application/pdf');
}

// ─── EXPORTAÇÃO PARA EXCEL ───────────────────────────────────────────────────
export async function exportReportToExcel(
  reportData: ReportData,
  options: ExportOptions
): Promise<{ url: string; key: string }> {
  const workbook = new ExcelJS.Workbook();

  // Aba de Dados
  const dataSheet = workbook.addWorksheet('Dados');

  // Headers
  if (reportData.data.length > 0) {
    const headers = Object.keys(reportData.data[0]);
    const headerRow = dataSheet.addRow(headers);

    // Formatação de headers
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF003366' },
    };
    headerRow.alignment = { horizontal: 'center' as any, vertical: 'middle' };

    // Dados
    reportData.data.forEach((row) => {
      dataSheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    headers.forEach((_, index) => {
      const column = dataSheet.getColumn(index + 1);
      column.width = 20;
    });

    // Adicionar filtros
    if (dataSheet.autoFilter) {
      (dataSheet.autoFilter as any).from = 'A1';
      (dataSheet.autoFilter as any).to = `${String.fromCharCode(64 + headers.length)}${reportData.data.length + 1}`;
    }
  }

  // Aba de Resumo
  if (reportData.summary) {
    const summarySheet = workbook.addWorksheet('Resumo');
    let row = 1;

    summarySheet.addRow([reportData.title]);
    summarySheet.getRow(row).font = { bold: true, size: 14 };
    row++;

    if (reportData.period) {
      summarySheet.addRow([`Período: ${reportData.period}`]);
      row++;
    }

    summarySheet.addRow([]);
    row++;

    Object.entries(reportData.summary).forEach(([key, value]) => {
      summarySheet.addRow([key, value]);
      row++;
    });

    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 30;
  }

  // Aba de Gráficos (dados para criar gráficos no Excel)
  if (options.includeCharts && reportData.charts && reportData.charts.length > 0) {
    const chartsSheet = workbook.addWorksheet('Gráficos');

    reportData.charts.forEach((chart, index) => {
      const startRow = index * 15 + 1;
      chartsSheet.addRow([chart.title]);
      chartsSheet.getRow(startRow).font = { bold: true };

      const dataStartRow = startRow + 1;
      chartsSheet.addRow(['Label', ...chart.datasets.map((d) => d.label)]);

      chart.labels.forEach((label, labelIndex) => {
        const row: any[] = [label];
        chart.datasets.forEach((dataset) => {
          row.push(dataset.data[labelIndex]);
        });
        chartsSheet.addRow(row);
      })
    });

    chartsSheet.getColumn(1).width = 20;
  }

  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  return storagePut(`reports/${fileName}`, buffer as any, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// ─── EXPORTAÇÃO DE DASHBOARD PARA PDF ─────────────────────────────────────────
export async function exportDashboardToPdf(
  dashboardId: number,
  options: ExportOptions
): Promise<{ url: string; key: string }> {
  const dashboards = await db.getDashboards(dashboardId);
  const kpis = await db.getKpis(dashboardId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height, width } = page.getSize();

  let yPosition = height - 50;

  // Cabeçalho
  page.drawText('Dashboard: ' + options.title, {
    x: 50,
    y: yPosition,
    size: 20,
    color: rgb(0, 51, 102),
  });
  yPosition -= 30;

  // Data de exportação
  page.drawText(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, {
    x: 50,
    y: yPosition,
    size: 10,
    color: rgb(150, 150, 150),
  });
  yPosition -= 40;

  // KPIs
  page.drawText('KPIs:', {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0, 51, 102),
  });
  yPosition -= 25;

  kpis.forEach((kpi) => {
    const statusColor =
      kpi.status === 'Ótimo'
        ? rgb(0, 128, 0)
        : kpi.status === 'Bom'
          ? rgb(0, 102, 204)
          : kpi.status === 'Atenção'
            ? rgb(255, 165, 0)
            : rgb(255, 0, 0);

    page.drawText(`${kpi.name}: ${kpi.value} ${kpi.unit || ''}`, {
      x: 70,
      y: yPosition,
      size: 11,
      color: statusColor,
    });

    page.drawText(`Target: ${kpi.target} | Status: ${kpi.status} | Tendência: ${kpi.trend}`, {
      x: 70,
      y: yPosition - 15,
      size: 9,
      color: rgb(100, 100, 100),
    });

    yPosition -= 40;

    if (yPosition < 50) {
      const newPage = pdfDoc.addPage([612, 792]);
      yPosition = 792 - 50;
    }
  });

  const pdfBytes = await pdfDoc.save();
  const fileName = `dashboard_${options.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

  return storagePut(`dashboards/${fileName}`, pdfBytes, 'application/pdf');
}

// ─── EXPORTAÇÃO DE DASHBOARD PARA EXCEL ──────────────────────────────────────
export async function exportDashboardToExcel(
  dashboardId: number,
  options: ExportOptions
): Promise<{ url: string; key: string }> {
  const kpis = await db.getKpis(dashboardId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Dashboard');

  // Título
  sheet.addRow([options.title]);
  sheet.getRow(1).font = { bold: true, size: 14 };

  // Data de exportação
  sheet.addRow([`Exportado em: ${new Date().toLocaleString('pt-BR')}`]);
  sheet.getRow(2).font = { size: 10, italic: true };

  sheet.addRow([]);

  // Headers de KPIs
  const headers = ['Nome', 'Métrica', 'Valor', 'Target', 'Unidade', 'Status', 'Tendência', 'Última Atualização'];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF003366' },
  };

  // Dados de KPIs
  kpis.forEach((kpi) => {
    sheet.addRow([
      kpi.name,
      kpi.metric,
      kpi.value,
      kpi.target,
      kpi.unit || '',
      kpi.status,
      kpi.trend,
      kpi.lastUpdated ? new Date(kpi.lastUpdated).toLocaleString('pt-BR') : '',
    ]);
  });

  // Auto-fit columns
  headers.forEach((_, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = 18;
  });

  const fileName = `dashboard_${options.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  return storagePut(`dashboards/${fileName}`, buffer as any, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// ─── FUNÇÃO GENÉRICA DE EXPORTAÇÃO ───────────────────────────────────────────
export async function exportData(
  data: ReportData,
  format: 'pdf' | 'excel',
  options: ExportOptions
): Promise<{ url: string; key: string }> {
  if (format === 'pdf') {
    return exportReportToPdf(data, { ...options, format: 'pdf' });
  } else {
    return exportReportToExcel(data, { ...options, format: 'excel' });
  }
}
