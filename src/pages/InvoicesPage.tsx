// src/pages/Invoices.tsx
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
import InvoiceDataGrid from "../components/dashboard/InvoiceDataGrid";
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
import { InvoiceErrorBoundary } from "../error/ErrorBoundary";

// Interfaces
interface ListData {
  invoices: any;
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
  // ✅ If "All" or no filter, return null to fetch all invoices
  if (!filter || filter === "All") {
    return { from: undefined, to: undefined };
  }

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

const InvoicesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { company } = useAuth();
  const companyCurrency = company?.currencySymbol || "$";

  // Context
  const context = useOutletContext<OutletContextType>();
  const {
    activeFilter: globalFilter,
    customDateRange,
    searchText,
    onFilterChange,
    onClearFilter,
    onCustomDateChange,
  } = context;

  const [localFilter, setLocalFilter] = useState<string | null>(null); // ✅ null = show all
  const [shouldApplyFilter, setShouldApplyFilter] = useState(false);

  // State
  const [invoiceList, setInvoiceList] = useState<ListData | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
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
        response = await invoiceService.update(invoiceIdNumber, data);
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

  const handlePrintInvoice = async (id: string) => {
    try {
      console.log("🖨️ Print button clicked for invoice:", id);
      toast.info("Preparing invoice for print...");

      const invoiceForPrint = await invoiceService.getInvoiceForPrint(
        parseInt(id)
      );

      console.log("📄 Invoice data fetched:", invoiceForPrint);

      const companyInfo = {
        name: company?.companyName || "Your Company",
        companyID: company?.companyID,
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

  const fetchFilteredData = useCallback(async () => {
    const filterToUse = shouldApplyFilter && localFilter ? localFilter : null;
    console.log("🔄 Fetching invoice list...", {
      shouldApplyFilter,
      localFilter,
      filterToUse: filterToUse || "ALL",
    });

    setError(null);
    setIsLoadingList(true);

    try {
      let listDataWithCounts;

      // ✅ If no filter, fetch all
      if (!filterToUse) {
        console.log("📊 Fetching ALL invoices (no filter)");
        listDataWithCounts = await invoiceService.getListWithItemCounts();
      } else {
        // ✅ Apply filter
        const { from, to } = getDateRange(filterToUse, customDateRange);
        console.log("📊 Fetching filtered invoices:", { from, to });
        listDataWithCounts = await invoiceService.getListWithItemCounts(
          from,
          to
        );
      }

      console.log("📊 Invoice List Received:", listDataWithCounts?.length);

      // Process invoice list
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
    } catch (err: any) {
      console.error("❌ Error fetching invoice data:", err);
      setError(err);
      setIsLoadingList(false);
    }
  }, [shouldApplyFilter, localFilter, customDateRange]);

  // ✅ Fetch data on initial load AND filter change
  useEffect(() => {
    console.log("🔄 Filter changed or initial load - fetching invoice data");
    fetchFilteredData();
  }, []);

  useEffect(() => {
    if (globalFilter && globalFilter !== "Today") {
      // ✅ User changed filter from header
      console.log("🔄 Global filter changed:", globalFilter);
      setLocalFilter(globalFilter);
      setShouldApplyFilter(true);
    }
  }, [globalFilter, customDateRange]);

  // ✅ Re-fetch when local filter changes
  useEffect(() => {
    if (shouldApplyFilter) {
      console.log("🔄 Local filter changed - re-fetching");
      fetchFilteredData();
    }
  }, [shouldApplyFilter, localFilter, fetchFilteredData]);

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

  if (error && !isLoadingList) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorDisplay message={error.message} onRetry={fetchFilteredData} />
      </Box>
    );
  }

  return (
    <>
      <InvoiceErrorBoundary>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            All Invoices
          </Typography>

          <Box sx={{ mb: 2 }}>
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

          <Box sx={{ width: "100%" }}>
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
              onPrintMultiple={handlePrintMultiple}
              enableSelection={true}
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
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
            >
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
      </InvoiceErrorBoundary>
    </>
  );
};

export default InvoicesPage;
