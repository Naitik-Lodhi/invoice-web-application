// src/utils/printInvoice.ts
// Replace ENTIRE file

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
  companyID?: number; // ✅ NEW: For localStorage key
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export const printInvoice = async (
  invoice: Invoice,
  companyCurrency: string = "$",
  companyInfo?: CompanyInfo
) => {
  console.log("🖨️ printInvoice called");
  console.log("   Invoice:", invoice.invoiceNumber);
  console.log("   Company:", companyInfo?.name);

  const invoiceDate = format(new Date(invoice.date), "dd-MMM-yyyy");
  const printDate = format(new Date(), "dd-MMM-yyyy hh:mm a");

  // ✅ Try to get logo from localStorage first
  let logoBase64 = '';
  let useFallback = true;

  if (companyInfo?.companyID) {
    const storedLogo = localStorage.getItem(`company_logo_base64_${companyInfo.companyID}`);
    if (storedLogo) {
      logoBase64 = storedLogo;
      useFallback = false;
      console.log("✅ Using logo from localStorage");
    } else {
      console.log("⚠️ No logo in localStorage, using fallback");
    }
  }

  console.log("   Using fallback:", useFallback);

  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 30px;
          border-bottom: 2px solid #eee;
        }

        .logo-container {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-logo {
          max-width: 100px;
          max-height: 100px;
          object-fit: contain;
          border-radius: 8px;
        }

        .company-logo-fallback {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
          line-height: 1.6;
        }

        .invoice-title-bar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 12px 30px;
          border-bottom: 1px solid #eee;
        }

        .invoice-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
        }

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
          font-weight: 600;
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
          margin-top: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
        }

        .notes-section {
          background: #f9f9f9;
          border-left: 3px solid #667eea;
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
          line-height: 1.5;
        }

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
          color: #667eea;
        }

        @media print {
          body {
            padding: 0;
            background: white;
          }
          .invoice-container {
            box-shadow: none;
            border-radius: 0;
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="logo-container">
            ${
              !useFallback && logoBase64
                ? `<img src="${logoBase64}" alt="${companyInfo?.name}" class="company-logo" />`
                : `<div class="company-logo-fallback">${
                    companyInfo?.name?.charAt(0)?.toUpperCase() || "C"
                  }</div>`
            }
          </div>
          <div class="company-info">
            <div class="company-name">${
              companyInfo?.name || "Your Company"
            }</div>
            <div class="company-details">
              ${companyInfo?.address ? `<div>${companyInfo.address}</div>` : ""}
              ${
                companyInfo?.city || companyInfo?.zipCode
                  ? `<div>${companyInfo.city || ""}${
                      companyInfo.city && companyInfo.zipCode ? ", " : ""
                    }${companyInfo.zipCode || ""}</div>`
                  : ""
              }
              ${
                companyInfo?.phone
                  ? `<div>Phone: ${companyInfo.phone}</div>`
                  : ""
              }
              ${
                companyInfo?.email
                  ? `<div>Email: ${companyInfo.email}</div>`
                  : ""
              }
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
                <th>Item Name</th>
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
                      <td class="text-right">${companyCurrency}${item.rate.toFixed(
                    2
                  )}</td>
                      <td class="text-center">${item.discountPct}%</td>
                      <td class="text-right">${companyCurrency}${(
                    item.quantity * item.price
                  ).toFixed(2)}</td>
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
              <span>TOTAL</span>
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
        console.log("📄 Print window loaded");
        window.onload = function() {
          console.log("🖨️ Opening print dialog...");
          setTimeout(() => {
            window.print();
          }, 500);
          
          window.onafterprint = function() {
            console.log("✅ Print dialog closed");
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  console.log("📄 Opening print window...");

  const printWindow = window.open(
    "",
    "PRINT",
    "width=900,height=800"
  );

  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
    console.log("✅ Print window opened successfully");
  } else {
    console.error("❌ Failed to open print window");
    alert("Please allow pop-ups to print the invoice.");
  }
};