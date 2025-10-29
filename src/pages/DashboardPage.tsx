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
  Paper,
  IconButton,
  Modal,
} from "@mui/material";
import { List, ListItem, Divider } from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
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
      if (customRange?.start) {
        from = customRange.start.format("YYYY-MM-DD");
        to = customRange.end
          ? customRange.end.format("YYYY-MM-DD")
          : today.format("YYYY-MM-DD");
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

  const [customerModalOpen, setCustomerModalOpen] = useState(false); // Changed name
  const [topCustomers, setTopCustomers] = useState<
    { name: string; amount: number; percentage: number }[]
  >([]);

  // Add this function to calculate top customers (add it with your other useCallback functions)
  const calculateTopCustomers = useCallback(() => {
    if (!invoiceList?.invoices || invoiceList.invoices.length === 0) return [];

    // Create a map to aggregate amounts by customer
    const customerMap = new Map<string, number>();

    invoiceList.invoices.forEach((invoice: any) => {
      const customer = invoice.customer || "Unknown Customer";
      const amount = invoice.total || 0;
      customerMap.set(customer, (customerMap.get(customer) || 0) + amount);
    });

    // Calculate total for percentage
    const total = metrics?.totalAmount || 0;

    // Convert to array, sort by amount, and take top 5
    return Array.from(customerMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoiceList, metrics?.totalAmount]);

  useEffect(() => {
    const customers = calculateTopCustomers();
    setTopCustomers(customers);
  }, [calculateTopCustomers]);

  const handleCustomerCardClick = (event: React.MouseEvent<HTMLElement>) => {
    if (topCustomers.length > 0) {
      setCustomerModalOpen(true);
    }
  };

  const handleCustomerModalClose = () => {
    setCustomerModalOpen(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

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

        console.log("📝 Calling update with:", {
          invoiceId: invoiceIdNumber,
          updatedOnPrev: data.updatedOn,
        });

        response = await invoiceService.update(invoiceIdNumber, data as any);

        console.log("✅ Update response received:", {
          invoiceID: response.invoiceID,
          primaryKeyID: response.primaryKeyID,
          updatedOn: response.updatedOn,
        });
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
      await fetchFilteredData();
      await fetchTrendData();
      handleCloseEditor();

      // ✅ Return standardized format
      const result = {
        invoiceID: String(
          response.invoiceID ||
            response.primaryKeyID ||
            response.InvoiceID ||
            ""
        ),
        updatedOn: response.updatedOn || new Date().toISOString(),
      };

      console.log("✅ Returning to InvoiceEditor:", result);

      return result;
    } catch (error: any) {
      console.error("❌ Save error:", error);
      console.error("   Response data:", error.response?.data);
      console.error("   Status:", error.response?.status);

      if (error.response?.status === 409) {
        // ✅ Show backend's actual error message
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data ||
          "Invoice was modified by another user";
        throw new Error(errorMessage);
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

  const handlePrintInvoice = async (id: string) => {
    try {
      console.log("🖨️ Print button clicked for invoice:", id);
      toast.info("Preparing invoice for print...");

      const invoiceForPrint = await invoiceService.getInvoiceForPrint(
        parseInt(id)
      );

      console.log("📄 Invoice data fetched:", invoiceForPrint);

      // ✅ Pass companyID for localStorage lookup
      const companyInfo = {
        name: company?.companyName || "Your Company",
        companyID: company?.companyID, // ✅ NEW: For localStorage key
        address: company?.address || "",
        city: company?.city || "",
        zipCode: company?.zipCode || "",
      };

      console.log("🏢 Company info for print:", companyInfo);

      await printInvoice(invoiceForPrint, companyCurrency, companyInfo);

      console.log("✅ Print function completed");
    } catch (error: any) {
      console.error("❌ Print error:", error);
      toast.error("Failed to prepare invoice for printing");
    }
  };

  const handlePrintMultiple = async (ids: string[]) => {
    try {
      console.log("🖨️ Printing multiple invoices:", ids);
      toast.info(`Preparing ${ids.length} invoices for print...`);

      // Fetch all selected invoices
      const invoicesForPrint = await Promise.all(
        ids.map((id) => invoiceService.getInvoiceForPrint(parseInt(id)))
      );

      const companyInfo = {
        name: company?.companyName || "Your Company",
        companyID: company?.companyID,
        address: company?.address || "",
        city: company?.city || "",
        zipCode: company?.zipCode || "",
      };

      // Import the new function
      const { printMultipleInvoices } = await import("../utils/printInvoice");
      await printMultipleInvoices(
        invoicesForPrint,
        companyCurrency,
        companyInfo
      );

      console.log("✅ Multiple print completed");
    } catch (error: any) {
      console.error("❌ Multiple print error:", error);
      toast.error("Failed to prepare invoices for printing");
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
      await fetchFilteredData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const fetchFilteredData = useCallback(
    async (overrideFilter?: string) => {
      const currentFilter = overrideFilter || activeFilter;
      const { from, to } = getDateRange(currentFilter, customDateRange);

      console.log("🔄 Fetching filtered data...", {
        currentFilter, // ✅ Should be "Custom"
        customDateRange: {
          start: customDateRange.start?.format("YYYY-MM-DD"),
          end: customDateRange.end?.format("YYYY-MM-DD"),
        },
        from,
        to,
      });

      setError(null);
      setIsLoadingMetrics(true);
      setIsLoadingList(true);
      setIsLoadingTopItems(true);

      try {
        // ✅ ONLY fetch filter-dependent APIs
        const [metricsData, listDataWithCounts, topItemsData] =
          await Promise.all([
            invoiceService.getMetrics(from, to),
            invoiceService.getListWithItemCounts(from, to),
            invoiceService.getTopItems(5, from, to),
          ]);

        console.log("📊 Filtered Data Received:", {
          metrics: metricsData,
          list: listDataWithCounts?.length,
          topItems: topItemsData?.length,
        });

        // Process metrics (Card 1 & 2)
        const metricsObject = Array.isArray(metricsData)
          ? metricsData[0]
          : metricsData;
        setMetrics({
          invoiceCount: metricsObject?.invoiceCount || 0,
          totalAmount: metricsObject?.totalAmount || 0,
        });
        setIsLoadingMetrics(false);

        // Process invoice list (Grid)
        const invoicesWithId = (
          Array.isArray(listDataWithCounts) ? listDataWithCounts : []
        ).map((invoice) => ({
          ...invoice,
          id: String(invoice.invoiceID),
          invoiceNumber: `INV-${invoice.invoiceNo}`,
          date: invoice.invoiceDate,
          customer: invoice.customerName,
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

        // Process top items (Card 4)
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
      } catch (err: any) {
        console.error("❌ Error fetching filtered data:", err);
        setError(err);
        setIsLoadingMetrics(false);
        setIsLoadingList(false);
        setIsLoadingTopItems(false);
      }
    },
    [activeFilter, customDateRange]
  );

  const fetchTrendData = useCallback(async () => {
    setIsLoadingTrend(true);
    try {
      const trendData = await invoiceService.getTrend12m();

      if (trendData && Array.isArray(trendData) && trendData.length > 0) {
        // ✅ No transformation needed - service already returns formatted data
        console.log("📊 Trend data received:", trendData);
        setTrend12m({ months: trendData });
      } else {
        console.warn("⚠️ No trend data or empty array");
        setTrend12m({ months: [] });
      }
    } catch (err: any) {
      console.error("❌ Error fetching trend data:", err);
      setTrend12m({ months: [] });
    } finally {
      setIsLoadingTrend(false);
    }
  }, []);

  useEffect(() => {
    console.log("🎬 Initial load - fetching trend data");
    fetchTrendData();
  }, []); // ✅ Empty dependency - runs only once

  // ✅ FILTER CHANGE: Fetch filtered data
  useEffect(() => {
    if (activeFilter) {
      console.log("🔄 Filter changed - fetching filtered data");
      fetchFilteredData();
    }
  }, [activeFilter, customDateRange, fetchFilteredData]);

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

  const dashboardInvoices = filteredInvoices.slice(0, 5);

  const isInitialLoading = isLoadingMetrics && !metrics;

  if (error && !isInitialLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorDisplay message={error.message} onRetry={fetchFilteredData} />
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
          // Add these new props
          onTotalAmountClick={handleCustomerCardClick}
          topCustomers={topCustomers}
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

        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Invoices
            </Typography>
            <Button
              variant="text"
              onClick={() => (window.location.href = "/invoices")}
              sx={{ textTransform: "none" }}
            >
              View All ({filteredInvoices.length})
            </Button>
          </Box>

          <Box sx={{ width: "100%" }}>
            <InvoiceDataGrid
              invoices={dashboardInvoices}
              visibleColumns={columnVisibility
                .filter((c) => c.visible)
                .map((c) => c.field)}
              onEdit={handleEditInvoice}
              onPrint={handlePrintInvoice}
              onDelete={handleDeleteInvoice}
              onPrintMultiple={handlePrintMultiple} // NEW
              loading={isLoadingList}
              searchText={gridSearchText}
              companyCurrency={companyCurrency}
              enableSelection={true} // NEW
            />
          </Box>
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

      {/* Top Customers Modal */}
      <Modal
        open={customerModalOpen}
        onClose={handleCustomerModalClose}
        aria-labelledby="top-customers-modal"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          sx={{
            width: { xs: "95%", sm: "90%", md: "70%", lg: "60%" },
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            p: { xs: 2, sm: 3, md: 4 },
            position: "relative",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleCustomerModalClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Modal Header */}
          <Typography
            variant="h5"
            sx={{
              mb: 1,
              fontWeight: 600,
              pr: 5,
            }}
          >
            👥 Top 5 Customers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Contribution to total revenue ({activeFilter})
          </Typography>

          {topCustomers.length > 0 ? (
            <>
              {/* Stats Summary */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mb: 4,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total from Top 5
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {companyCurrency}
                    {topCustomers
                      .reduce((sum, c) => sum + c.amount, 0)
                      .toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Average per Customer
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {companyCurrency}
                    {(
                      topCustomers.reduce((sum, c) => sum + c.amount, 0) /
                      topCustomers.length
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Coverage
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {topCustomers
                      .reduce((sum, c) => sum + c.percentage, 0)
                      .toFixed(1)}
                    %
                  </Typography>
                </Box>
              </Box>

              {/* Customer List with Progress Bars */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Customer Breakdown
                </Typography>
                <List sx={{ p: 0 }}>
                  {topCustomers.map((customer, index) => (
                    <Box key={index}>
                      <ListItem
                        sx={{
                          px: 0,
                          py: 2,
                          flexDirection: "column",
                          alignItems: "stretch",
                        }}
                      >
                        {/* Customer Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            {/* Rank Badge */}
                            <Box
                              sx={{
                                minWidth: 36,
                                height: 36,
                                borderRadius: "50%",
                                bgcolor:
                                  index === 0
                                    ? "#fbbf24"
                                    : index === 1
                                    ? "#669bebff"
                                    : index === 2
                                    ? "#c5f613ff"
                                    : index === 3
                                    ? "#d1ddf6ff"
                                    : "#58e4d9ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                color: index < 3 ? "#fff" : "#374151",
                                boxShadow:
                                  index < 3
                                    ? "0 2px 8px rgba(0,0,0,0.15)"
                                    : "none",
                              }}
                            >
                              #{index + 1}
                            </Box>

                            {/* Customer Name */}
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 600 }}
                              >
                                {customer.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {customer.percentage.toFixed(1)}% of total
                                revenue
                              </Typography>
                            </Box>
                          </Box>

                          {/* Amount */}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.primary.main,
                            }}
                          >
                            {companyCurrency}
                            {formatNumber(customer.amount)}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < topCustomers.length - 1 && (
                        <Divider sx={{ my: 0.5 }} />
                      )}
                    </Box>
                  ))}
                </List>
              </Box>

              {/* Customer Cards Grid */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Quick Overview
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {topCustomers.slice(0, 3).map((customer, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        bgcolor:
                          index === 0
                            ? "rgba(251, 191, 36, 0.1)"
                            : index === 1
                            ? "rgba(156, 163, 175, 0.1)"
                            : "rgba(249, 115, 22, 0.1)",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Rank Badge in Corner */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: -10,
                          right: -10,
                          width: 60,
                          height: 60,
                          bgcolor:
                            index === 0
                              ? "#fbbf24"
                              : index === 1
                              ? "#669bebff"
                              : "#c5f613ff",
                          borderRadius: "50%",
                          opacity: 0.2,
                        }}
                      />

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        #{index + 1} Customer
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        {customer.name}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {companyCurrency}
                        {customer.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          pt: 1,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {customer.percentage.toFixed(1)}% contribution
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <PersonIcon
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography color="text.secondary" variant="body1">
                No customer data available
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data will appear once invoices are created
              </Typography>
            </Box>
          )}
        </Paper>
      </Modal>
    </>
  );
};

export default DashboardPage;
