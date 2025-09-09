import { formatCurrency, formatDate } from './format';

export type FinancePdfInvoice = {
  id: string;
  amount: number;
  dueDate: string | Date;
  status: 'pending' | 'paid' | 'overdue';
};

export type FinancePdfPayment = {
  id: string;
  amount: number;
  paidAt: string | Date;
  reference?: string | null;
  invoice: { id: string };
};

export type FinancePdfData = {
  student: { id: string; name: string };
  invoices: ReadonlyArray<FinancePdfInvoice>;
  payments: ReadonlyArray<FinancePdfPayment>;
  currency: string; // e.g., 'USD', 'EUR'
  locale: string; // e.g., 'es-ES', 'en-US'
  schoolName?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateFinanceHtml(data: FinancePdfData): string {
  const { student, invoices, payments, currency, locale } = data;
  const totalDue = invoices.reduce((acc, i) => acc + (i.status !== 'paid' ? i.amount : 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const invoiceRows = invoices
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.id)}</td>
        <td>${formatDate(i.dueDate, locale)}</td>
        <td class="num">${formatCurrency(i.amount, locale, currency)}</td>
        <td>${escapeHtml(i.status)}</td>
      </tr>`,
    )
    .join('');

  const paymentRows = payments
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.id)}</td>
        <td>${formatDate(p.paidAt, locale)}</td>
        <td class="num">${formatCurrency(p.amount, locale, currency)}</td>
        <td>${escapeHtml(p.reference || '')}</td>
      </tr>`,
    )
    .join('');

  const brandName = escapeHtml(data.schoolName || 'MI Campus');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${brandName} · Finance</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; color: #111827; }
        .sheet { padding: 24px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { width: 40px; height: 40px; }
        .brand .name { font-weight: 700; font-size: 18px; color: #111827; }
        .title { font-weight: 600; font-size: 20px; color: #111827; margin: 0; }
        .muted { color: #6b7280; font-size: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #f3f4f6; }
        th { background: #f9fafb; font-weight: 600; font-size: 12px; color: #374151; }
        td { font-size: 12px; }
        .num { text-align: right; white-space: nowrap; }
        .summary { display: flex; gap: 24px; margin-top: 8px; }
        .summary .item { font-size: 12px; }
        @media print {
          .noprint { display: none !important; }
          body { margin: 0; }
          .sheet { padding: 12mm; }
          @page { size: A4; margin: 12mm; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div class="brand">
            <img src="${location.origin}/icon-192.png" alt="${brandName} logo" />
            <div class="name">${brandName}</div>
          </div>
          <div class="muted">${new Date().toLocaleString(locale)}</div>
        </div>
        <h1 class="title">Finance Summary</h1>
        <div class="muted">Student: ${escapeHtml(student.name)} · ID: ${escapeHtml(student.id)}</div>
        <div class="summary">
          <div class="item">Total Due: <strong>${formatCurrency(totalDue, locale, currency)}</strong></div>
          <div class="item">Total Paid: <strong>${formatCurrency(totalPaid, locale, currency)}</strong></div>
        </div>

        <div class="grid" style="margin-top:16px;">
          <div class="card">
            <div style="font-weight:600;margin-bottom:8px;">Invoices</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Due Date</th>
                  <th class="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceRows || '<tr><td colspan="4" class="muted">No invoices</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="card">
            <div style="font-weight:600;margin-bottom:8px;">Payments</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paid At</th>
                  <th class="num">Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                ${paymentRows || '<tr><td colspan="4" class="muted">No payments</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => { window.print(); }, 50);
        });
      </script>
    </body>
  </html>`;
}

export async function openFinancePdf(data: FinancePdfData): Promise<void> {
  const html = generateFinanceHtml(data);
  const popup = window.open('', '_blank');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
