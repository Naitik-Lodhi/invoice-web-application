// src/utils/exportData.ts
import { format } from "date-fns";
import * as XLSX from "xlsx";

// Export invoices to Excel
export const exportInvoicesToExcel = (
  invoices: any[],
  companyCurrency: string = "$"
) => {
  // ✅ Validation: Check if there's data to export
  if (!invoices || invoices.length === 0) {
    console.warn('No invoices to export');
    return;
  }

  // CSV Headers
  const headers = [
    "Invoice Number",
    "Date",
    "Customer",
    "Items Count",
    "Sub Total",
    "Tax %",
    "Tax Amount",
    "Total Amount",
  ];

  // Convert invoices to CSV rows
  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber || "-",
    invoice.date ? format(new Date(invoice.date), "dd-MMM-yyyy") : "-",
    invoice.customer || "-",
    invoice.items?.length || 0,
    `${companyCurrency}${(invoice.subTotal || 0).toFixed(2)}`,
    `${(invoice.taxPercent || 0)}%`,
    `${companyCurrency}${(invoice.taxAmount || 0).toFixed(2)}`,
    `${companyCurrency}${(invoice.total || 0).toFixed(2)}`,
  ]);

  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // ✅ Set column widths for better formatting
    worksheet['!cols'] = [
      { wch: 15 }, // Invoice Number
      { wch: 12 }, // Date
      { wch: 20 }, // Customer
      { wch: 10 }, // Items Count
      { wch: 12 }, // Sub Total
      { wch: 8 },  // Tax %
      { wch: 12 }, // Tax Amount
      { wch: 12 }, // Total Amount
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    const fileName = `invoices_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    console.log(`✅ Exported ${invoices.length} invoices to ${fileName}`);
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
};

// Export items to Excel
export const exportItemsToExcel = (
  items: any[],
  companyCurrency: string = "$"
) => {
  // ✅ Validation: Check if there's data to export
  if (!items || items.length === 0) {
    console.warn('No items to export');
    return;
  }

  // CSV Headers
  const headers = [
    "Item Name",
    "Description",
    "Sale Rate",
    "Discount %",
    "Created Date",
    "Updated Date",
  ];

  // Convert items to CSV rows
  const rows = items.map((item) => [
    item.itemName || "-",
    item.description || "",
    `${companyCurrency}${(item.salesRate || 0).toFixed(2)}`,
    `${(item.discountPct || 0).toFixed(2)}%`,
    item.createdAt || item.createdOn 
      ? format(new Date(item.createdAt || item.createdOn), "dd-MMM-yyyy")
      : "-",
    item.updatedAt || item.updatedOn || item.createdOn
      ? format(new Date(item.updatedAt || item.updatedOn || item.createdOn), "dd-MMM-yyyy")
      : "-",
  ]);

  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // ✅ Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Item Name
      { wch: 35 }, // Description
      { wch: 12 }, // Sale Rate
      { wch: 10 }, // Discount %
      { wch: 12 }, // Created Date
      { wch: 12 }, // Updated Date
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
    const fileName = `items_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    console.log(`✅ Exported ${items.length} items to ${fileName}`);
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
};