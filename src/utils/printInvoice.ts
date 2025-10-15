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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          color: #1f2937;
          background: #f9fafb;
        }
        
        .invoice-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .invoice-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        
        .company-name {
          font-size: 50px;
          font-weight: 700;
          margin-bottom: 15px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .invoice-body {
          padding: 30px;
        }
        
        .invoice-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .meta-section h3 {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        
        .meta-section p {
          font-size: 15px;
          margin-bottom: 6px;
          color: #1f2937;
        }
        
        .meta-section .highlight {
          font-weight: 600;
          font-size: 18px;
          color: #111827;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        thead {
          background: #f9fafb;
        }
        
        th {
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }
        
        tbody tr:hover {
          background: #f9fafb;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .item-name {
          font-weight: 500;
          color: #111827;
        }
        
        .discount-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 8px;
        }
        
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        
        .totals {
          width: 350px;
          background: #f9fafb;
          padding: 24px;
          border-radius: 8px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 15px;
        }
        
        .totals-row.subtotal {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-row.tax {
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
        }
        
        .totals-row.total {
          border-top: 2px solid #667eea;
          font-weight: 700;
          font-size: 20px;
          color: #111827;
          padding-top: 16px;
          margin-top: 8px;
        }
        
        .totals-row.total .amount {
          color: #667eea;
        }
        
        .notes-section {
          background: #fffbeb;
          border-left: 4px solid #fbbf24;
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        
        .notes-section h4 {
          font-size: 14px;
          color: #92400e;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .notes-section p {
          font-size: 13px;
          color: #78350f;
          line-height: 1.6;
        }
        
        .footer {
          background: #f9fafb;
          padding: 24px 30px;
          text-align: center;
          border-top: 2px solid #e5e7eb;
        }
        
        .footer-content {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.8;
        }
        
        .footer-highlight {
          color: #667eea;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 8px;
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
          
          tbody tr:hover {
            background: transparent;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header - Center Aligned -->
        <div class="invoice-header">
          <div class="company-name">${
            companyInfo?.name || "Your Company"
          }</div>
        </div>
        
        <!-- Invoice Body -->
        <div class="invoice-body">
          <!-- Invoice Meta Info -->
          <div class="invoice-meta">
            <div class="meta-section">
              <h3>Bill To</h3>
              <p class="highlight">${invoice.customer}</p>
              ${invoice.address ? `<p>${invoice.address}</p>` : ""}
              ${invoice.city ? `<p>${invoice.city}</p>` : ""}
            </div>
            
            <div class="meta-section" style="text-align: right;">
              <h3>Invoice Details</h3>
              <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoiceDate}</p>
              <p><strong>Tax Rate:</strong> ${invoice.taxPercent}%</p>
            </div>
          </div>
          
          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 50px;" class="text-center">#</th>
                <th>Item Description</th>
                <th class="text-center" style="width: 80px;">Qty</th>
                <th class="text-right" style="width: 100px;">Rate</th>
                <th class="text-center" style="width: 80px;">Disc%</th>
                <th class="text-right" style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>
                    <div class="item-name">${item.name}</div>
                    ${
                      item.discountPct > 0
                        ? `<span class="discount-badge">${item.discountPct}% OFF</span>`
                        : ""
                    }
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${companyCurrency}${item.rate.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}</td>
                  <td class="text-center">${item.discountPct}%</td>
                  <td class="text-right">${companyCurrency}${(
                    item.quantity * item.price
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div class="totals-section">
            <div class="totals">
              <div class="totals-row subtotal">
                <span>Subtotal</span>
                <span>${companyCurrency}${invoice.subTotal.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}</span>
              </div>
              
              <div class="totals-row tax">
                <span>Tax (${invoice.taxPercent}%)</span>
                <span>${companyCurrency}${invoice.taxAmount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}</span>
              </div>
              
              <div class="totals-row total">
                <span>Total Amount</span>
                <span class="amount">${companyCurrency}${invoice.total.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}</span>
              </div>
            </div>
          </div>
          
          <!-- Notes -->
          ${
            invoice.notes
              ? `
          <div class="notes-section">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
          </div>
          `
              : ""
          }
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-highlight">Thank you for your business!</div>
            <div>Printed on: ${printDate}</div>
            ${
              companyInfo?.email
                ? `<div>For any queries, contact us at ${companyInfo.email}</div>`
                : ""
            }
          </div>
        </div>
      </div>
      
      <script>
        // Set document title for better PDF save name
        document.title = '${invoice.invoiceNumber}_${invoice.customer.replace(/[^a-zA-Z0-9]/g, "_")}';
        
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 250);
          
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