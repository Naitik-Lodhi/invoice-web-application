// src/pages/Dashboard.tsx
import {
  Box,
  useTheme,
  useMediaQuery,
  DialogTitle,
  Dialog,
  DialogContent,
  Typography,
  DialogActions,
  Button,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import InvoiceDataGrid from "../components/dashboard/InvoiceDataGrid";
import { DashboardGridSkeleton } from "../components/skeleton/DashboardGrid.skeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import type { Column } from "../components/ActionBar";
import ActionBar from "../components/ActionBar";
import InvoiceEditor, {
  type InvoiceFormData,
} from "../components/invoice/InvoiceEditor";
import { printInvoice } from "../utils/printInvoice";
import { exportInvoicesToExcel } from "../utils/exportData";
import { useAuth } from "../context/AuthContext";
import { invoiceService } from "../services/invoiceService";
import { toast } from "../utils/toast";

// Interfaces
interface MetricsData {
  invoiceCount: number;
  totalAmount: number;
}

interface ListData {
  invoices: any;
}

interface TrendData {
  months: { month: string; amount: number; count: number }[];
}

interface TopItemsData {
  items: { name: string; value: number; quantity: number }[];
}

interface OutletContextType {
  activeFilter: string;
  customDateRange: { start: Dayjs | null; end: Dayjs | null };
  searchText: string;
  onFilterChange: (filter: string) => void;
  onClearFilter: () => void;
  onCustomDateChange: (start: Dayjs | null, end: Dayjs | null) => void;
}

// Helper function to get date range
const getDateRange = (
  filter: string,
  customRange?: { start: Dayjs | null; end: Dayjs | null }
) => {
  const today = dayjs();
  let from = today.format("YYYY-MM-DD");
  let to = today.format("YYYY-MM-DD");

  switch (filter) {
    case "Today":
      from = today.format("YYYY-MM-DD");
      to = today.format("YYYY-MM-DD");
      break;
    case "Week":
      from = today.startOf("week").format("YYYY-MM-DD");
      to = today.endOf("week").format("YYYY-MM-DD");
      break;
    case "Month":
      from = today.startOf("month").format("YYYY-MM-DD");
      to = today.endOf("month").format("YYYY-MM-DD");
      break;
    case "Year":
      from = today.startOf("year").format("YYYY-MM-DD");
      to = today.endOf("year").format("YYYY-MM-DD");
      break;
    case "Custom":
      if (customRange?.start && customRange?.end) {
        from = customRange.start.format("YYYY-MM-DD");
        to = customRange.end.format("YYYY-MM-DD");
      }
      break;
  }

  return { from, to };
};

const DashboardPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { company } = useAuth();
  const companyCurrency = company?.currencySymbol || "$";

  // Context
  const context = useOutletContext<OutletContextType>();
  const {
    activeFilter,
    customDateRange,
    searchText,
    onFilterChange,
    onClearFilter,
    onCustomDateChange,
  } = context;

  // State
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [invoiceList, setInvoiceList] = useState<ListData | null>(null);
  const [trend12m, setTrend12m] = useState<TrendData | null>(null);
  const [topItems, setTopItems] = useState<TopItemsData | null>(null);

  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [isLoadingTopItems, setIsLoadingTopItems] = useState(true);

  const [error, setError] = useState<Error | null>(null);
  const [gridSearchText, setGridSearchText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Invoice Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"new" | "edit">("new");
  const [editingInvoiceId, setEditingInvoiceId] = useState<
    string | undefined
  >();

  // Get next invoice number
  const getNextInvoiceNumber = useCallback(() => {
    if (!invoiceList?.invoices?.length) return 1001;

    const maxInvoiceNo = Math.max(
      ...invoiceList.invoices.map((inv: any) => {
        const num = parseInt(inv.invoiceNo, 10);
        return isNaN(num) ? 0 : num;
      })
    );

    return isFinite(maxInvoiceNo) ? maxInvoiceNo + 1 : 1001;
  }, [invoiceList]);

  const nextInvoiceNumber = getNextInvoiceNumber();

  // Column visibility
  const getInitialColumnVisibility = (): Column[] => {
    return [
      { field: "invoiceNumber", headerName: "Invoice No", visible: true },
      { field: "date", headerName: "Date", visible: true },
      { field: "customer", headerName: "Customer", visible: true },
      { field: "items", headerName: "Items", visible: !isMobile },
      { field: "subTotal", headerName: "Sub Total", visible: !isMobile },
      { field: "taxPercent", headerName: "Tax %", visible: !isMobile },
      { field: "taxAmount", headerName: "Tax Amt", visible: !isMobile },
      { field: "total", headerName: "Total", visible: true },
      { field: "actions", headerName: "Actions", visible: true },
    ];
  };

  const [columnVisibility, setColumnVisibility] = useState<Column[]>(
    getInitialColumnVisibility
  );

  useEffect(() => {
    const newVisibility = getInitialColumnVisibility();
    const hasChanged =
      JSON.stringify(newVisibility) !== JSON.stringify(columnVisibility);

    if (hasChanged) {
      setColumnVisibility(newVisibility);
    }
  }, [isMobile]);
  
  const handleColumnVisibilityChange = (field: string, visible: boolean) => {
    setColumnVisibility((prev) =>
      prev.map((col) => (col.field === field ? { ...col, visible } : col))
    );
  };

  // Handlers
  const handleNewInvoice = () => {
    setEditorMode("new");
    setEditingInvoiceId(undefined);
    setEditorOpen(true);
  };

  const handleEditInvoice = (id: string) => {
    setEditorMode("edit");
    setEditingInvoiceId(id);
    setEditorOpen(true);
  };

  const handleSaveInvoice = async (data: InvoiceFormData) => {
    try {
      let response: any;

      if (editorMode === "edit" && editingInvoiceId) {
        const invoiceIdNumber = parseInt(editingInvoiceId, 10);
        if (isNaN(invoiceIdNumber)) {
          throw new Error(`Invalid invoice ID: ${editingInvoiceId}`);
        }
        response = await invoiceService.update(invoiceIdNumber, data as any);
      } else if (editorMode === "new") {
        response = await invoiceService.create(data as any);
      } else {
        throw new Error(`Invalid mode: ${editorMode}`);
      }

      toast.success(
        editorMode === "new"
          ? "Invoice created successfully"
          : "Invoice updated successfully"
      );

      // Refresh data
      await fetchData();
      handleCloseEditor();

      return {
        invoiceID: String(response.invoiceID ?? ""),
        updatedOn: response.updatedOn ?? new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Save error:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data?.includes("Duplicate Invoice")
      ) {
        throw new Error(
          "Invoice number already exists. The system tried to create a new invoice instead of updating."
        );
      } else if (error.response?.status === 409) {
        throw new Error(
          "Invoice number already exists. Please use a different number."
        );
      } else if (error.response?.status === 412) {
        throw new Error(
          "Invoice was modified by another user. Please reload and try again."
        );
      }

      throw new Error(error.response?.data?.error || "Failed to save invoice");
    }
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditorMode("new");
    setEditingInvoiceId(undefined);
  };

  const handleExport = () => {
    exportInvoicesToExcel(filteredInvoices, companyCurrency);
  };

  // ✅ Update handlePrintInvoice function (find and replace)
const handlePrintInvoice = async (id: string) => {
  try {
    toast.info("Preparing invoice for print...");

    // Fetch full invoice details with item names
    const invoiceForPrint = await invoiceService.getInvoiceForPrint(
      parseInt(id)
    );

    // Get company info from context
    const companyInfo = {
      name: company?.companyName || "Your Company",
    };

    // Print invoice with company details
    printInvoice(invoiceForPrint, companyCurrency, companyInfo);
  } catch (error: any) {
    console.error("Print error:", error);
    toast.error("Failed to prepare invoice for printing");
  }
};

  const handleDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      await invoiceService.delete(parseInt(invoiceToDelete));
      toast.success("Invoice deleted successfully");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  // fetch data with temporary fix to show item count it was backend problem
  const fetchData = useCallback(
  async (overrideFilter?: string) => {
    const currentFilter = overrideFilter || activeFilter;
    const { from, to } = getDateRange(currentFilter, customDateRange);

    console.log("🔄 Fetching dashboard data...", {
      filter: currentFilter,
      from,
      to,
    });

    setError(null);
    setIsLoadingMetrics(true);
    setIsLoadingList(true);
    setIsLoadingTopItems(true);
    setIsLoadingTrend(true);

    try {
      // ✅ CHANGED: Use helper function instead of getList
      const [metricsData, listDataWithCounts, topItemsData, trendData] =
        await Promise.all([
          invoiceService.getMetrics(from, to),
          invoiceService.getListWithItemCounts(from, to), // 👈 Changed this line
          invoiceService.getTopItems(5, from, to),
          invoiceService.getTrend12m(),
        ]);

      console.log("📊 All Data Received:", {
        metrics: metricsData,
        list: listDataWithCounts?.length,
        topItems: topItemsData?.length,
        trend: trendData?.length,
      });

      // Process metrics
      const metricsObject = Array.isArray(metricsData)
        ? metricsData[0]
        : metricsData;
      setMetrics({
        invoiceCount: metricsObject?.invoiceCount || 0,
        totalAmount: metricsObject?.totalAmount || 0,
      });
      setIsLoadingMetrics(false);

      // ✅ CHANGED: Process invoice list with item counts
      const invoicesWithId = (
        Array.isArray(listDataWithCounts) ? listDataWithCounts : []
      ).map((invoice) => ({
        ...invoice,
        id: String(invoice.invoiceID),
        invoiceNumber: `INV-${invoice.invoiceNo}`,
        date: invoice.invoiceDate,
        customer: invoice.customerName,
        // ✅ Create items array from lineItemCount
        items: Array.from({ length: invoice.lineItemCount || 0 }, (_, i) => ({
          quantity: 1,
          name: `Item ${i + 1}`,
          price: 0,
        })),
        subTotal: invoice.subTotal,
        taxPercent: invoice.taxPercentage,
        taxAmount: invoice.taxAmount,
        total: invoice.invoiceAmount,
        address: invoice.address,
        city: invoice.city,
      }));

      setInvoiceList({ invoices: invoicesWithId });
      setIsLoadingList(false);

      // Process top items (no changes)
      if (topItemsData && Array.isArray(topItemsData)) {
        const formattedItems = topItemsData
          .filter((item) => item.itemName !== "Others")
          .map((item) => ({
            name: item.itemName || "Unknown",
            value: item.amountSum,
            quantity: 0,
          }));
        setTopItems({ items: formattedItems });
      } else {
        setTopItems({ items: [] });
      }
      setIsLoadingTopItems(false);

      // Process trend data (no changes)
      if (trendData && Array.isArray(trendData) && trendData.length > 0) {
        console.log("✅ Processing trend data, count:", trendData.length);

        const formattedTrend = {
          months: trendData
            .filter((item) => item && item.month)
            .map((item) => {
              let monthStr = "";
              try {
                if (item.month) {
                  const date = new Date(item.month);
                  if (!isNaN(date.getTime())) {
                    monthStr = date.toLocaleDateString("en-US", {
                      month: "short",
                      year: "2-digit",
                    });
                  }
                }
              } catch (e) {
                console.error("❌ Error formatting month:", item.month, e);
              }

              return {
                month: monthStr || "N/A",
                amount: typeof item.amount === "number" ? item.amount : 0,
                count: typeof item.count === "number" ? item.count : 0,
              };
            })
            .filter((item) => item.month !== "N/A"),
        };

        console.log("📊 Formatted Trend:", formattedTrend);
        setTrend12m(formattedTrend);
      } else {
        console.log("⚠️ No trend data received");
        setTrend12m({ months: [] });
      }
      setIsLoadingTrend(false);
    } catch (err: any) {
      console.error("❌ Error fetching data:", err);
      setError(err);
      setIsLoadingMetrics(false);
      setIsLoadingList(false);
      setIsLoadingTopItems(false);
      setIsLoadingTrend(false);
    }
  },
  [activeFilter, customDateRange]
);


  // ✅ FIXED: Only fetch when filter changes
  useEffect(() => {
    if (activeFilter) {
      fetchData();
    }
  }, [activeFilter, customDateRange]); // ✅ Remove fetchData from dependencies

  useEffect(() => {
    if (activeFilter) {
      fetchData();
    }
  }, [activeFilter, customDateRange, fetchData]);

  // Filter invoices
  const filteredInvoices =
    invoiceList?.invoices.filter((invoice: any) => {
      let matchesHeaderSearch = true;
      let matchesGridSearch = true;

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        matchesHeaderSearch =
          invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
          invoice.customer?.toLowerCase().includes(searchLower);
      }

      if (gridSearchText) {
        const gridSearchLower = gridSearchText.toLowerCase();
        matchesGridSearch =
          invoice.invoiceNumber?.toLowerCase().includes(gridSearchLower) ||
          invoice.customer?.toLowerCase().includes(gridSearchLower) ||
          invoice.items?.some((item: any) =>
            item.name?.toLowerCase().includes(gridSearchLower)
          );
      }

      return matchesHeaderSearch && matchesGridSearch;
    }) || [];

  const isInitialLoading = isLoadingMetrics && !metrics;

  if (error && !isInitialLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorDisplay message={error.message} onRetry={fetchData} />
      </Box>
    );
  }

  if (isInitialLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <DashboardGridSkeleton />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <DashboardGrid
          invoiceCount={metrics?.invoiceCount || 0}
          totalAmount={metrics?.totalAmount || 0}
          companyCurrency={companyCurrency}
          trend12mData={trend12m}
          topItemsData={topItems}
          invoices={filteredInvoices}
          isLoadingMetrics={isLoadingMetrics}
          isLoadingList={isLoadingList}
          isLoadingTrend={isLoadingTrend}
          isLoadingTopItems={isLoadingTopItems}
          currentFilter={activeFilter}
          searchText={searchText}
          onFilterChange={isMobile ? onFilterChange : undefined}
          onClearFilter={isMobile ? onClearFilter : undefined}
          onCustomDateChange={isMobile ? onCustomDateChange : undefined}
        />

        <Box sx={{ mt: 3, mb: 2 }}>
          <ActionBar
            searchText={gridSearchText}
            onSearchChange={setGridSearchText}
            onNewInvoice={handleNewInvoice}
            isNewButtonDisabled={isLoadingList}
            onExport={handleExport}
            columns={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            totalRecords={filteredInvoices.length}
            buttonName="New Invoice"
            searchBarPlaceholder="Search invoices..."
            isExportDisabled={filteredInvoices.length === 0 || isLoadingList} 
          />
        </Box>

        <Box sx={{  width: "100%" }}>
          <InvoiceDataGrid
            invoices={filteredInvoices}
            visibleColumns={columnVisibility
              .filter((c) => c.visible)
              .map((c) => c.field)}
            onEdit={handleEditInvoice}
            onPrint={handlePrintInvoice}
            onDelete={handleDeleteInvoice}
            loading={isLoadingList}
            searchText={gridSearchText}
            companyCurrency={companyCurrency}
          />
        </Box>
      </Box>

      <InvoiceEditor
        open={editorOpen}
        mode={editorMode}
        invoiceId={editingInvoiceId}
        onClose={handleCloseEditor}
        onSave={handleSaveInvoice}
        companyCurrency={companyCurrency}
        nextInvoiceNumber={nextInvoiceNumber}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this invoice? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardPage;
