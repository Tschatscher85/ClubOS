import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Erstellt ein HTML-Dokument fuer eine Formular-Einreichung,
   * das wie ein gedrucktes Formular aussieht.
   */
  async htmlExportErstellen(
    tenantId: string,
    einreichungId: string,
  ): Promise<string> {
    const einreichung = await this.prisma.formSubmission.findFirst({
      where: { id: einreichungId, tenantId },
      include: { template: true },
    });

    if (!einreichung) {
      throw new NotFoundException('Einreichung nicht gefunden.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const daten = einreichung.daten as Record<string, unknown>;
    const felder = einreichung.template.fields as unknown as Array<{
      name: string;
      label: string;
    }>;

    const statusLabel = this.statusUebersetzen(einreichung.status);
    const eingereichtAm = new Date(einreichung.createdAt).toLocaleDateString(
      'de-DE',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    const felderHtml = felder
      .map((feld) => {
        const wert = daten[feld.name] ?? '';
        const wertAnzeige =
          typeof wert === 'object' ? JSON.stringify(wert) : String(wert);

        return `
        <tr>
          <td class="label">${this.escapeHtml(feld.label)}</td>
          <td class="wert">${this.escapeHtml(wertAnzeige) || '<span class="leer">– nicht ausgefuellt –</span>'}</td>
        </tr>`;
      })
      .join('\n');

    const unterschriftHtml = einreichung.signatureUrl
      ? `
      <div class="unterschrift-bereich">
        <h3>Unterschrift</h3>
        <img src="${this.escapeHtml(einreichung.signatureUrl)}" alt="Digitale Unterschrift" class="unterschrift-bild" />
      </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(einreichung.template.name)} – ${this.escapeHtml(tenant.name)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 20px;
    }
    .dokument {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d1d5db;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .kopfzeile {
      background: ${this.escapeHtml(tenant.primaryColor || '#1a56db')};
      color: #ffffff;
      padding: 24px 32px;
    }
    .kopfzeile h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .kopfzeile .vereinsname {
      font-size: 14px;
      opacity: 0.9;
    }
    .meta-bereich {
      display: flex;
      justify-content: space-between;
      padding: 16px 32px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
    }
    .meta-bereich .status {
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }
    .status-eingereicht { background: #fef3c7; color: #92400e; }
    .status-genehmigt { background: #d1fae5; color: #065f46; }
    .status-abgelehnt { background: #fee2e2; color: #991b1b; }
    .status-in-bearbeitung { background: #dbeafe; color: #1e40af; }
    .inhalt {
      padding: 24px 32px;
    }
    .inhalt h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table tr {
      border-bottom: 1px solid #f3f4f6;
    }
    table tr:last-child {
      border-bottom: none;
    }
    td {
      padding: 10px 12px;
      vertical-align: top;
      font-size: 14px;
    }
    td.label {
      width: 40%;
      font-weight: 600;
      color: #374151;
      background: #f9fafb;
    }
    td.wert {
      color: #1f2937;
    }
    .leer {
      color: #9ca3af;
      font-style: italic;
    }
    .unterschrift-bereich {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
    }
    .unterschrift-bereich h3 {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }
    .unterschrift-bild {
      max-width: 300px;
      max-height: 120px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 8px;
      background: #ffffff;
    }
    .fusszeile {
      padding: 16px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .dokument {
        box-shadow: none;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="dokument">
    <div class="kopfzeile">
      <h1>${this.escapeHtml(einreichung.template.name)}</h1>
      <div class="vereinsname">${this.escapeHtml(tenant.name)}</div>
    </div>

    <div class="meta-bereich">
      <div>
        <strong>Eingereicht am:</strong> ${eingereichtAm}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>E-Mail:</strong> ${this.escapeHtml(einreichung.email)}
      </div>
      <div>
        <span class="status ${this.statusCssKlasse(einreichung.status)}">${statusLabel}</span>
      </div>
    </div>

    <div class="inhalt">
      <h2>Formulardaten</h2>
      <table>
        ${felderHtml}
      </table>

      ${unterschriftHtml}
    </div>

    <div class="fusszeile">
      Erstellt mit Vereinbase &mdash; ${this.escapeHtml(tenant.name)} &mdash; Exportiert am ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
    </div>
  </div>
</body>
</html>`;
  }

  private statusUebersetzen(status: string): string {
    const labels: Record<string, string> = {
      EINGEREICHT: 'Eingereicht',
      IN_BEARBEITUNG: 'In Bearbeitung',
      GENEHMIGT: 'Genehmigt',
      ABGELEHNT: 'Abgelehnt',
    };
    return labels[status] || status;
  }

  private statusCssKlasse(status: string): string {
    const klassen: Record<string, string> = {
      EINGEREICHT: 'status-eingereicht',
      IN_BEARBEITUNG: 'status-in-bearbeitung',
      GENEHMIGT: 'status-genehmigt',
      ABGELEHNT: 'status-abgelehnt',
    };
    return klassen[status] || '';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
