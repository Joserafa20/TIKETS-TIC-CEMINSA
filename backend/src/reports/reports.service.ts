import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getTickets(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where['fechaApertura'] = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    return this.prisma.ticket.findMany({
      where,
      include: {
        categoria: { select: { nombre: true } },
        solicitante: { select: { nombre: true, area: true } },
        tecnico: { select: { nombre: true } },
      },
      orderBy: { fechaApertura: 'desc' },
    });
  }

  async generatePdf(from?: string, to?: string): Promise<Buffer> {
    const tickets = await this.getTickets(from, to);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const periodLabel =
      from && to ? `${from} al ${to}` : from ? `desde ${from}` : to ? `hasta ${to}` : 'todos los períodos';

    // Header
    doc.fontSize(18).fillColor('#1e40af').text('Reporte de Tickets — ESE CEMINSA', { align: 'center' });
    doc.fontSize(11).fillColor('#64748b').text(`Área de Sistemas TIC`, { align: 'center' });
    doc.fontSize(10).text(`Período: ${periodLabel}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);

    // Summary
    const byStatus: Record<string, number> = {};
    const avgRating = tickets.filter((t) => t.calificacion).map((t) => t.calificacion!);

    for (const t of tickets) byStatus[t.estado] = (byStatus[t.estado] ?? 0) + 1;

    doc.fontSize(13).fillColor('#1e293b').text('Resumen', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Total de tickets: ${tickets.length}`);
    for (const [estado, count] of Object.entries(byStatus)) {
      doc.text(`  • ${estado}: ${count}`);
    }
    if (avgRating.length > 0) {
      const avg = (avgRating.reduce((a, b) => a + b, 0) / avgRating.length).toFixed(1);
      doc.text(`Satisfacción promedio: ${avg} / 5 (${avgRating.length} calificaciones)`);
    }
    doc.moveDown();

    // Table header
    doc.fontSize(13).fillColor('#1e293b').text('Detalle de Tickets', { underline: true });
    doc.moveDown(0.3);

    const colX = [40, 180, 280, 360, 430, 500];
    const headers = ['Fecha', 'Título', 'Categoría', 'Estado', 'Prioridad', 'Técnico'];

    doc.fontSize(9).fillColor('#1e40af');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 60 }));
    doc.moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').stroke();
    doc.moveDown(0.2);

    for (const t of tickets) {
      if (doc.y > 720) {
        doc.addPage();
        doc.fontSize(9).fillColor('#1e40af');
        headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 60 }));
        doc.moveDown(0.2);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').stroke();
        doc.moveDown(0.2);
      }

      const y = doc.y;
      doc.fontSize(8).fillColor('#334155');
      doc.text(new Date(t.fechaApertura).toLocaleDateString('es-CO'), colX[0], y, { width: 136 });
      doc.text(t.titulo.slice(0, 28), colX[1], y, { width: 96 });
      doc.text(t.categoria.nombre.slice(0, 18), colX[2], y, { width: 76 });
      doc.text(t.estado, colX[3], y, { width: 66 });
      doc.text(t.prioridad, colX[4], y, { width: 66 });
      doc.text(t.tecnico?.nombre?.slice(0, 14) ?? '—', colX[5], y, { width: 55 });
      doc.moveDown(0.6);
    }

    doc.end();
    return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  }

  async generateExcel(from?: string, to?: string): Promise<Buffer> {
    const tickets = await this.getTickets(from, to);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Soporte TIC CEMINSA';

    const sheet = workbook.addWorksheet('Tickets');

    // Title row
    sheet.mergeCells('A1:K1');
    const title = sheet.getCell('A1');
    title.value = 'Reporte de Tickets — ESE CEMINSA';
    title.font = { bold: true, size: 14, color: { argb: 'FF1e40af' } };
    title.alignment = { horizontal: 'center' };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      'Fecha apertura', 'Título', 'Descripción', 'Categoría', 'Prioridad',
      'Estado', 'Solicitante', 'Área', 'Técnico', 'Fecha cierre', 'Calificación',
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
      cell.alignment = { horizontal: 'center' };
    });

    for (const t of tickets) {
      sheet.addRow([
        new Date(t.fechaApertura).toLocaleDateString('es-CO'),
        t.titulo,
        t.descripcion,
        t.categoria.nombre,
        t.prioridad,
        t.estado,
        t.solicitante.nombre,
        t.solicitante.area ?? '—',
        t.tecnico?.nombre ?? '—',
        t.fechaCierre ? new Date(t.fechaCierre).toLocaleDateString('es-CO') : '—',
        t.calificacion ?? '—',
      ]);
    }

    sheet.columns = [
      { width: 16 }, { width: 32 }, { width: 40 }, { width: 20 }, { width: 12 },
      { width: 14 }, { width: 24 }, { width: 20 }, { width: 20 }, { width: 16 }, { width: 12 },
    ];

    // Summary sheet
    const summary = workbook.addWorksheet('Resumen');
    summary.addRow(['Métrica', 'Valor']);
    summary.addRow(['Total tickets', tickets.length]);

    const byStatus: Record<string, number> = {};
    for (const t of tickets) byStatus[t.estado] = (byStatus[t.estado] ?? 0) + 1;
    for (const [k, v] of Object.entries(byStatus)) summary.addRow([k, v]);

    const ratings = tickets.filter((t) => t.calificacion).map((t) => t.calificacion!);
    if (ratings.length > 0) {
      summary.addRow(['Satisfacción promedio', (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)]);
    }

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
