// src/utils/printInvoice.ts
import { format } from "date-fns";

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  rate: number;
  discountPct: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string | Date;
  customer: string;
  items: InvoiceItem[];
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  address?: string;
  city?: string;
  notes?: string;
}

interface CompanyInfo {
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export const printInvoice = (
  invoice: Invoice,
  companyCurrency: string = "$",
  companyInfo?: CompanyInfo
) => {
  const invoiceDate = format(new Date(invoice.date), "dd-MMM-yyyy");
  const printDate = format(new Date(), "dd-MMM-yyyy hh:mm a");

  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.customer} - ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
          padding: 20px;
          background: #fff;
          color: #222;
        }

        .invoice-container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        /* Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 30px;
          border-bottom: 2px solid #eee;
        }

        .company-logo {
          max-width: 100px;
          max-height: 100px;
          object-fit: contain;
        }

        .company-info {
          text-align: right;
          font-size: 13px;
          color: #444;
        }

        .company-name {
          font-size: 20px;
          font-weight: 700;
          color: #111;
          margin-bottom: 4px;
        }

        .company-details div {
          line-height: 1.4;
        }

        /* Title Bar */
        .invoice-title-bar {
          background: #f9f9f9;
          padding: 12px 30px;
          border-bottom: 1px solid #eee;
        }

        .invoice-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        /* Body */
        .invoice-body {
          padding: 30px;
        }

        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .meta-section h3 {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 8px;
        }

        .meta-section p {
          font-size: 13px;
          color: #333;
          margin-bottom: 3px;
        }

        .meta-section .highlight {
          font-weight: 600;
          font-size: 15px;
          color: #000;
          margin-bottom: 6px;
        }

        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }

        th, td {
          padding: 10px 8px;
          border: 1px solid #e5e5e5;
          font-size: 13px;
        }

        th {
          background: #f5f5f5;
          font-weight: 600;
          color: #333;
          text-transform: uppercase;
          font-size: 12px;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals */
        .totals {
          width: 300px;
          margin-left: auto;
          border-top: 2px solid #000;
          padding-top: 10px;
          font-size: 14px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .totals-row.total {
          font-weight: 700;
          font-size: 16px;
        }

        /* Notes */
        .notes-section {
          background: #fdfdfd;
          border-left: 3px solid #ccc;
          padding: 12px 16px;
          margin-top: 20px;
        }

        .notes-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: #444;
          margin-bottom: 5px;
        }

        .notes-section p {
          font-size: 13px;
          color: #555;
        }

        /* Footer */
        .footer {
          background: #f9f9f9;
          color: #666;
          padding: 12px 20px;
          font-size: 12px;
          text-align: center;
          border-top: 1px solid #ddd;
        }

        .footer-highlight {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 4px;
        }

        @media print {
          body {
            padding: 0;
            background: white;
          }
          .invoice-container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            ${
              companyInfo?.logo
                ? `<img src="${companyInfo.logo}" alt="${companyInfo.name}" class="company-logo" onerror="this.style.display='none'" />`
                : ""
            }
          </div>
          <div class="company-info">
            <div class="company-name">${companyInfo?.name || "Your Company"}</div>
            <div class="company-details">
              ${companyInfo?.address ? `<div>${companyInfo.address}</div>` : ""}
              ${
                companyInfo?.city || companyInfo?.zipCode
                  ? `<div>${companyInfo.city || ""}${companyInfo.city && companyInfo.zipCode ? ", " : ""}${companyInfo.zipCode || ""}</div>`
                  : ""
              }
              ${companyInfo?.phone ? `<div>Phone: ${companyInfo.phone}</div>` : ""}
              ${companyInfo?.email ? `<div>Email: ${companyInfo.email}</div>` : ""}
              ${companyInfo?.website ? `<div>${companyInfo.website}</div>` : ""}
            </div>
          </div>
        </div>

        <div class="invoice-title-bar">
          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="invoice-body">
          <div class="invoice-meta">
            <div class="meta-section">
              <h3>Bill To</h3>
              <p class="highlight">${invoice.customer}</p>
              ${invoice.address ? `<p>${invoice.address}</p>` : ""}
              ${invoice.city ? `<p>${invoice.city}</p>` : ""}
            </div>

            <div class="meta-section">
              <h3>Invoice Details</h3>
              <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoiceDate}</p>
              <p><strong>Tax Rate:</strong> ${invoice.taxPercent}%</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center" style="width:40px;">#</th>
                <th>Item Description</th>
                <th class="text-center" style="width:80px;">Qty</th>
                <th class="text-right" style="width:100px;">Rate</th>
                <th class="text-center" style="width:90px;">Discount</th>
                <th class="text-right" style="width:110px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.name}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">${companyCurrency}${item.rate.toFixed(2)}</td>
                      <td class="text-center">${item.discountPct}%</td>
                      <td class="text-right">${companyCurrency}${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${companyCurrency}${invoice.subTotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Tax (${invoice.taxPercent}%)</span>
              <span>${companyCurrency}${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div class="totals-row total">
              <span>Total</span>
              <span>${companyCurrency}${invoice.total.toFixed(2)}</span>
            </div>
          </div>

          ${
            invoice.notes
              ? `<div class="notes-section">
                  <h4>Notes</h4>
                  <p>${invoice.notes}</p>
                </div>`
              : ""
          }
        </div>

        <div class="footer">
          <div class="footer-highlight">Thank you for your business!</div>
          <div>Printed on: ${printDate}</div>
          <div>This is a computer-generated invoice.</div>
        </div>
      </div>

      <script>
        document.title = '${invoice.invoiceNumber}_${invoice.customer.replace(/[^a-zA-Z0-9]/g, "_")}';
        window.onload = function() {
          setTimeout(() => window.print(), 250);
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=800");
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
  } else {
    alert("Please allow pop-ups to print the invoice.");
  }
};
