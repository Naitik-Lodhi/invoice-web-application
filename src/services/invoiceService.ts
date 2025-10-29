// src/services/invoiceService.ts
import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

// Interfaces
export interface InvoiceLineItem {
  rowNo: number;
  itemID?: number;
  description?: string;
  quantity: number;
  rate: number;
  discountPct: number;
}

export interface InvoiceFormData {
  invoiceNo?: string;
  invoiceDate: string | Date;
  customerName: string;
  address?: string;
  city?: string;
  taxPercent: number;
  notes?: string;
  lineItems: Array<{
    id: string;
    itemId: string;
    itemName: string;
    description: string;
    quantity: number;
    rate: number;
    discountPct: number;
    amount: number;
  }>;
  updatedOn?: string;
}

export interface Invoice {
  invoiceID: number;
  invoiceNo: number;
  invoiceDate: string;
  customerName: string;
  address?: string;
  city?: string;
  taxPercentage: number;
  notes?: string;
  lines: InvoiceLineItem[];
  subTotal: number;
  taxAmount: number;
  total: number;
  updatedOn?: string;
}

export interface MetricsData {
  invoiceCount: number;
  totalAmount: number;
}

export interface TrendData {
  month: string;
  amount: number;
  count: number;
}

export interface TopItemData {
  itemID?: number;
  itemName: string;
  amountSum: number;
}

export interface InvoiceDetail {
  invoiceID: number;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  address?: string;
  city?: string;
  subTotal: number;
  taxPercentage: number;
  taxAmount: number;
  invoiceAmount: number;
  notes?: string;
  lines: Array<{
    invoiceItemID?: number;
    rowNo: number;
    itemID?: number;
    itemName?: string;
    description?: string;
    quantity: number;
    rate: number;
    discountPct: number;
    amount?: number;
  }>;
  updatedOn?: string | null;
}

// ✅ NEW: Item interface
export interface ItemData {
  itemID: number;
  itemName: string;
  itemCode?: string;
  rate?: number;
}

// ✅ Cache for item names (avoid repeated API calls)
let itemsCache: ItemData[] | null = null;
let itemsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const invoiceService = {
  // Existing: Get invoice list
  getList: async (from?: string, to?: string): Promise<Invoice[]> => {
    const params: any = {};
    if (from) params.fromDate = from;
    if (to) params.toDate = to;

    const response = await axiosInstance.get(API_ENDPOINTS.invoices.GET_LIST, {
      params,
    });
    return response.data;
  },

  // Existing: Get invoice by ID
  getById: async (invoiceId: number): Promise<InvoiceDetail> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.invoices.GET_BY_ID(invoiceId)
    );
    return response.data;
  },

  // ✅ NEW: Get all items with caching
  getItems: async (): Promise<ItemData[]> => {
    const now = Date.now();

    // Return cached data if still valid
    if (itemsCache && now - itemsCacheTime < CACHE_DURATION) {
      return itemsCache;
    }

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.items.GET_LIST);
      itemsCache = response.data;
      itemsCacheTime = now;
      return response.data;
    } catch (error) {
      console.error("Failed to fetch items:", error);
      // Return empty array if API fails
      return [];
    }
  },

  // ✅ NEW: Helper function to get invoice list with item counts
  getListWithItemCounts: async (from?: string, to?: string): Promise<any[]> => {
    try {
      // Get invoice list
      const invoices = await invoiceService.getList(from, to);

      // If no invoices, return empty array
      if (!invoices || invoices.length === 0) {
        return [];
      }

      console.log(`📊 Fetching item counts for ${invoices.length} invoices...`);

      const DETAIL_FETCH_LIMIT = 20;
      const invoicesToFetch = invoices.slice(0, DETAIL_FETCH_LIMIT);
      const remainingInvoices = invoices.slice(DETAIL_FETCH_LIMIT);

      // Fetch item counts for limited invoices
      const detailPromises = invoicesToFetch.map(async (invoice) => {
        try {
          const details = await invoiceService.getById(invoice.invoiceID);
          return {
            invoiceID: invoice.invoiceID,
            itemCount: details.lines?.length || 0,
          };
        } catch (error) {
          console.error(
            `Failed to get details for invoice ${invoice.invoiceID}`,
            error
          );
          return {
            invoiceID: invoice.invoiceID,
            itemCount: 0,
          };
        }
      });

      const itemCounts = await Promise.all(detailPromises);
      const itemCountMap = new Map(
        itemCounts.map((ic) => [ic.invoiceID, ic.itemCount])
      );

      // Merge item counts with invoice list
      const invoicesWithCounts = [
        ...invoicesToFetch.map((inv) => ({
          ...inv,
          lineItemCount: itemCountMap.get(inv.invoiceID) || 0,
        })),
        ...remainingInvoices.map((inv) => ({
          ...inv,
          lineItemCount: 0, // For performance, don't fetch all
        })),
      ];

      console.log(`✅ Fetched item counts for ${DETAIL_FETCH_LIMIT} invoices`);

      return invoicesWithCounts;
    } catch (error) {
      console.error("Error in getListWithItemCounts:", error);
      // Fallback: return invoices without item counts
      const invoices = await invoiceService.getList(from, to);
      return invoices.map((inv) => ({ ...inv, lineItemCount: 0 }));
    }
  },

  // ✅ NEW: Get invoice with item names for printing
  getInvoiceForPrint: async (invoiceId: number): Promise<any> => {
    try {
      const [invoiceData, itemsData] = await Promise.all([
        invoiceService.getById(invoiceId),
        invoiceService.getItems(),
      ]);

      // Create item map for quick lookup
      const itemMap = new Map(
        itemsData.map((item) => [item.itemID, item.itemName])
      );

      // Add item names to lines
      const linesWithNames = invoiceData.lines.map((line) => ({
        name: itemMap.get(line.itemID!) || line.description || "Unknown Item",
        quantity: line.quantity,
        rate: line.rate,
        discountPct: line.discountPct,
        price: line.rate * (1 - line.discountPct / 100),
      }));

      return {
        id: String(invoiceData.invoiceID),
        invoiceNumber: `INV-${invoiceData.invoiceNo}`,
        date: invoiceData.invoiceDate,
        customer: invoiceData.customerName,
        address: invoiceData.address,
        city: invoiceData.city,
        items: linesWithNames,
        subTotal: invoiceData.subTotal,
        taxPercent: invoiceData.taxPercentage,
        taxAmount: invoiceData.taxAmount,
        total: invoiceData.invoiceAmount,
        notes: invoiceData.notes,
      };
    } catch (error) {
      console.error("Error in getInvoiceForPrint:", error);
      throw error;
    }
  },

  // Existing: Create invoice
  create: async (data: InvoiceFormData): Promise<Invoice> => {
    const payload = {
      invoiceNo: data.invoiceNo,
      invoiceDate: data.invoiceDate,
      customerName: data.customerName.trim(),
      address: data.address || "",
      city: data.city || "",
      taxPercentage: data.taxPercent,
      notes: data.notes || "",
      lines: data.lineItems.map((item, index) => ({
        rowNo: index + 1,
        itemID: item.itemId ? parseInt(item.itemId) : null,
        description: item.description || "",
        quantity: item.quantity,
        rate: item.rate,
        discountPct: item.discountPct,
      })),
    };

    const response = await axiosInstance.post(
      API_ENDPOINTS.invoices.CREATE,
      payload
    );
    return response.data;
  },

  update: async (
    invoiceId: number,
    data: InvoiceFormData
  ): Promise<Invoice> => {
    const numericInvoiceId =
      typeof invoiceId === "string" ? parseInt(invoiceId, 10) : invoiceId;

    if (!numericInvoiceId || isNaN(numericInvoiceId) || numericInvoiceId <= 0) {
      throw new Error(`Invalid invoice ID for update: ${invoiceId}`);
    }

    const payload = {
      invoiceID: numericInvoiceId,
      invoiceNo: data.invoiceNo ? parseInt(data.invoiceNo as string) : null,
      invoiceDate: data.invoiceDate,
      customerName: data.customerName.trim(),
      address: data.address || "",
      city: data.city || "",
      taxPercentage: data.taxPercent,
      notes: data.notes || "",
      lines: data.lineItems.map((item, index) => ({
        rowNo: index + 1,
        itemID: item.itemId ? parseInt(item.itemId) : null,
        description: item.description || "",
        quantity: item.quantity,
        rate: item.rate,
        discountPct: item.discountPct,
      })),
      updatedOn: data.updatedOn || null,
    };

    console.log("📤 UPDATE API REQUEST:", {
      invoiceID: payload.invoiceID,
      updatedOn: payload.updatedOn,
    });

    const response = await axiosInstance.put(
      API_ENDPOINTS.invoices.UPDATE,
      payload
    );

    console.log("📥 UPDATE API RESPONSE (Raw):", response.data);

    // ✅ IMPORTANT: Transform backend response to expected format
    const transformedResponse = {
      invoiceID: response.data.primaryKeyID || numericInvoiceId,
      updatedOn: response.data.updatedOn,
      // Include other fields that might be needed
      ...response.data,
    };

    console.log("✅ UPDATE API RESPONSE (Transformed):", transformedResponse);

    // ✅ Validate updatedOn exists
    if (!transformedResponse.updatedOn) {
      console.error("❌ Backend did not return updatedOn!");
      throw new Error("Backend error: Missing updatedOn in response");
    }

    return transformedResponse as Invoice;
  },

  // Existing: Delete invoice
  delete: async (invoiceId: number): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.invoices.DELETE(invoiceId)
    );
    return response.data;
  },

  // Existing: Get metrics
  getMetrics: async (from?: string, to?: string): Promise<MetricsData> => {
    const params: any = {};
    if (from) params.fromDate = from;
    if (to) params.toDate = to;

    const response = await axiosInstance.get(
      API_ENDPOINTS.invoices.GET_METRICS,
      { params }
    );
    return response.data;
  },

  getTrend12m: async (asOf?: string): Promise<TrendData[]> => {
    try {
      // ✅ Current date generate karo agar nahi hai toh
      let dateToUse = asOf;

      if (!dateToUse) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        dateToUse = `${year}-${month}-${day}`;
      }

      console.log("🔍 TREND API DEBUG:");
      console.log("   Input asOf:", asOf);
      console.log("   Date to use:", dateToUse);
      console.log("   API Endpoint:", API_ENDPOINTS.invoices.GET_TREND_12M);
      console.log(
        "   Full URL will be:",
        `${API_ENDPOINTS.invoices.GET_TREND_12M}?asOf=${dateToUse}`
      );

      const response = await axiosInstance.get(
        API_ENDPOINTS.invoices.GET_TREND_12M,
        {
          params: { asOf: dateToUse },
        }
      );

      console.log("📥 TREND API RESPONSE:");
      console.log("   Status:", response.status);
      console.log("   Data length:", response.data?.length);
      console.log("   Full data:", response.data);
      console.log("   Response headers:", response.headers);

      // ✅ Month names array for formatting
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const transformedData = (response.data || [])
        .map((item: any, index: number) => {
          if (!item.monthStart) {
            console.warn("⚠️ Missing monthStart in item:", item);
            return null;
          }

          try {
            // ✅ Extract date parts directly (no timezone conversion)
            // Format: "2025-10-28T00:00:00" -> "2025-10-28"
            const dateOnly = item.monthStart.split("T")[0];
            const [year, month, day] = dateOnly.split("-");

            // ✅ Format as "Oct 25"
            // const formattedMonth = `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
            // invoiceService.ts - Update formatting line
            const formattedMonth = `${day} ${monthNames[parseInt(month) - 1]}`;

            console.log(
              `✅ Month ${index}:`,
              `API: ${item.monthStart}`,
              `→ Parsed: ${dateOnly}`,
              `→ Formatted: ${formattedMonth}`
            );

            return {
              month: formattedMonth, // ✅ Already formatted string
              amount: Number(item.amountSum) || 0,
              count: Number(item.invoiceCount) || 0,
            };
          } catch (error) {
            console.error(`❌ Error formatting date at index ${index}:`, error);
            return null;
          }
        })
        .filter((item: any) => item !== null);

      console.log("✅ Transformed Data:", transformedData);
      return transformedData;
    } catch (error: any) {
      console.error("❌ Error fetching trend data:", error);
      console.error("   Error response:", error.response?.data);
      console.error("   Error status:", error.response?.status);
      return [];
    }
  },
  // Existing: Get top items
  getTopItems: async (
    topN: number = 5,
    from?: string,
    to?: string
  ): Promise<TopItemData[]> => {
    const params: any = { topN };
    if (from) params.fromDate = from;
    if (to) params.toDate = to;

    const response = await axiosInstance.get(
      API_ENDPOINTS.invoices.GET_TOP_ITEMS,
      { params }
    );
    return response.data;
  },

  getLatestInvoiceNumber: async (): Promise<number> => {
    try {
      // ✅ Fetch ALL invoices (no filter) to get absolute max
      const response = await axiosInstance.get(API_ENDPOINTS.invoices.GET_LIST);
      const allInvoices = response.data;

      if (!allInvoices || allInvoices.length === 0) {
        console.log("📋 No invoices exist, starting from 1001");
        return 1001;
      }

      // ✅ Find maximum invoice number across ALL invoices
      const maxInvoiceNo = Math.max(
        ...allInvoices.map((inv: any) => {
          const num = parseInt(inv.invoiceNo, 10);
          return isNaN(num) ? 0 : num;
        })
      );

      const nextNumber = isFinite(maxInvoiceNo) ? maxInvoiceNo + 1 : 1001;

      console.log("✅ Latest invoice number:", {
        totalInvoices: allInvoices.length,
        maxInvoiceNo,
        nextNumber,
      });

      return nextNumber;
    } catch (error) {
      console.error("❌ Failed to get latest invoice number:", error);
      return 1001; // Fallback
    }
  },
};
