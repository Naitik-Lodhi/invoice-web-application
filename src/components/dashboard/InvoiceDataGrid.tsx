// src/components/dashboard/InvoiceDataGrid.tsx
import {
  Box,
  Tooltip,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  GridActionsCellItem,
  type GridRowsProp,
  type GridFilterModel,
  type GridSortModel,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import { useState, useMemo } from "react";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import { format } from "date-fns";

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
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
  status?: "paid" | "pending" | "overdue";
}

interface InvoiceDataGridProps {
  invoices: Invoice[];
  visibleColumns: string[];
  onEdit: (id: string) => void;
  onPrint: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  searchText?: string;
  companyCurrency?: string;
}

const InvoiceDataGrid = ({
  invoices,
  visibleColumns,
  onEdit,
  onPrint,
  onDelete,
  loading = false,
  companyCurrency = "$",
}: InvoiceDataGridProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "date", sort: "desc" },
  ]);

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  // Format date
  const formatDate = (date: string | Date) => {
    try {
      if (isMobile) return format(new Date(date), "dd-MMM");
      if (isTablet) return format(new Date(date), "dd-MMM-yy");
      return format(new Date(date), "dd-MMM-yyyy");
    } catch {
      return "-";
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    // ✅ Validate input
    if (
      amount === undefined ||
      amount === null ||
      typeof amount !== "number" ||
      isNaN(amount)
    ) {
      return `${companyCurrency}0.00`;
    }

    // ✅ Handle mobile abbreviations
    if (isMobile && amount >= 1000) {
      if (amount >= 1000000) {
        return `${companyCurrency}${(amount / 1000000).toFixed(1)}M`;
      }
      return `${companyCurrency}${Math.round(amount / 1000)}K`;
    }

    // ✅ Safe locale formatting with error handling
    try {
      return `${companyCurrency}${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch (error) {
      console.error("Format error for amount:", amount, error);
      return `${companyCurrency}${amount.toFixed(2)}`;
    }
  };

  // Define ALL columns with responsive widths
  const columns: GridColDef[] = useMemo(() => {
    // Define column configurations that adapt to screen size
    const columnConfigs: Record<string, Partial<GridColDef>> = {
      invoiceNumber: {
        field: "invoiceNumber",
        headerName: isMobile ? "Invoice" : "Invoice No",
        flex: isMobile ? 1 : 0.8,
        minWidth: isMobile ? 90 : 120,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: isMobile ? "0.75rem" : isTablet ? "0.8rem" : "0.875rem",
              color: "#171717",
              cursor: !isMobile ? "pointer" : undefined,
              "&:hover": !isMobile
                ? { color: "#000", textDecoration: "underline" }
                : undefined,
            }}
          >
            {isMobile ? params.value?.replace("INV-", "#") : params.value}
          </Typography>
        ),
      },
      date: {
        field: "date",
        headerName: "Date",
        flex: isMobile ? 0.8 : 0.7,
        minWidth: isMobile ? 75 : 100,
        valueFormatter: (value) => formatDate(value),
      },
      customer: {
        field: "customer",
        headerName: "Customer",
        flex: isMobile ? 1.2 : 1,
        minWidth: isMobile ? 80 : 150,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            sx={{
              fontSize: isMobile ? "0.7rem" : isTablet ? "0.8rem" : "0.875rem",
              fontWeight: !isMobile ? 500 : undefined,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isMobile && params.value?.length > 15
              ? params.value?.split(" ")[0]
              : params.value}
          </Typography>
        ),
      },
      items: {
        field: "items",
        headerName: "Items",
        flex: 0.5,
        minWidth: 60,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const items = params.value as InvoiceItem[];
          const count = items?.length || 0;

          if (count === 0) return "-";

          const chipContent = (
            <Chip
              label={count}
              size="small"
              sx={{
                height: isMobile ? 20 : 22,
                fontSize: isMobile ? "0.7rem" : "0.75rem",
                backgroundColor: count > 5 ? "#fee2e2" : "#f3f4f6",
                color: count > 5 ? "#dc2626" : "#374151",
                fontWeight: 600,
                cursor: !isMobile ? "pointer" : undefined,
              }}
            />
          );

          if (isMobile) return chipContent;

          return (
            <Tooltip
              title={
                <Box>
                  {items.map((item, idx) => (
                    <Typography key={idx} sx={{ fontSize: "0.75rem" }}>
                      • {item.name} (Qty: {item.quantity})
                    </Typography>
                  ))}
                </Box>
              }
            >
              {chipContent}
            </Tooltip>
          );
        },
        sortComparator: (v1, v2) => {
          const count1 = (v1 as InvoiceItem[])?.length || 0;
          const count2 = (v2 as InvoiceItem[])?.length || 0;
          return count1 - count2;
        },
      },
      subTotal: {
        field: "subTotal",
        headerName: isMobile ? "SubTot" : "Sub Total",
        flex: isMobile ? 0.9 : 0.8,
        minWidth: isMobile ? 80 : 110,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => formatCurrency(value || 0),
      },
      taxPercent: {
        field: "taxPercent",
        headerName: isMobile ? "Tax%" : "Tax %",
        flex: 0.5,
        minWidth: 60,
        type: "number",
        align: "center",
        headerAlign: "center",
        valueFormatter: (value) => `${value}%`,
      },
      taxAmount: {
        field: "taxAmount",
        headerName: isMobile ? "Tax" : isTablet ? "Tax" : "Tax Amt",
        flex: isMobile ? 0.8 : 0.7,
        minWidth: isMobile ? 70 : 90,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => formatCurrency(value || 0),
      },
      total: {
        field: "total",
        headerName: "Total",
        flex: isMobile ? 1 : 0.9,
        minWidth: isMobile ? 90 : 120,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "0.95rem",
              color: "#171717",
            }}
          >
            {formatCurrency(params.row.total || 0)}
          </Typography>
        ),
      },
      actions: {
        field: "actions",
        headerName: "Actions",
        flex: isMobile ? 1 : 0.8,
        minWidth: isMobile ? 100 : 120,
        maxWidth: 150,
        sortable: false,
        filterable: false,
        type: "actions",
        headerAlign: "center",
        getActions: (params) => {
          const actions = [
            <Tooltip title="Edit Invoice" key="edit">
              <GridActionsCellItem
                icon={<EditIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
                label="Edit"
                onClick={() => onEdit(params.id as string)}
                showInMenu={false}
              />
            </Tooltip>,
            <Tooltip title="Print Invoice" key="print">
              <GridActionsCellItem
                icon={<PrintIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
                label="Print"
                onClick={() => onPrint(params.id as string)}
                showInMenu={false}
              />
            </Tooltip>,
            <Tooltip title="Delete Invoice" key="delete">
              <GridActionsCellItem
                icon={
                  <DeleteIcon
                    color="error"
                    sx={{ fontSize: isMobile ? 18 : 20 }}
                  />
                }
                label="Delete"
                onClick={() => onDelete(params.id as string)}
                showInMenu={false}
              />
            </Tooltip>,
          ];

          return actions;
        },
      },
    };

    // Return columns based on what's requested in visibleColumns
    return visibleColumns
      .map((field) => columnConfigs[field])
      .filter(Boolean) as GridColDef[];
  }, [
    isMobile,
    isTablet,
    isDesktop,
    companyCurrency,
    onEdit,
    onPrint,
    onDelete,
    visibleColumns,
  ]);
  // Prepare rows
  const rows: GridRowsProp = invoices.map((invoice) => ({
    ...invoice,
    id: invoice.id || invoice.invoiceNumber,
  }));

  // ✅ FIXED: Calculate if we need horizontal scroll
  const needsHorizontalScroll = useMemo(() => {
    if (!isMobile) return false;

    // Check total minWidth of visible columns
    const totalMinWidth = columns.reduce((sum, col) => {
      return sum + (col.minWidth || 100);
    }, 0);

    // If total minWidth > screen width, we need scroll
    return totalMinWidth > window.innerWidth;
  }, [columns, isMobile]);

  return (
    <Box
      sx={{
        minHeight: 300,
        maxHeight: isMobile ? 600 : 800,
        width: "100%",
        overflowX: needsHorizontalScroll ? "auto" : "hidden",
        "& .MuiDataGrid-root": {
          border: "none",
          fontSize: isMobile ? "0.7rem" : isTablet ? "0.8rem" : "0.875rem",
          width: "100%",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f0f0f0",
            padding: isMobile ? "0 6px" : isTablet ? "0 8px" : "0 12px",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#fafafa",
            borderBottom: "2px solid #e0e0e0",
            minHeight: isMobile
              ? "40px !important"
              : isTablet
              ? "48px !important"
              : "56px !important",
            "& .MuiDataGrid-columnHeader": {
              fontWeight: 600,
              fontSize: isMobile ? "0.7rem" : isTablet ? "0.75rem" : "0.875rem",
              padding: isMobile ? "0 6px" : isTablet ? "0 8px" : "0 12px",
              "& .MuiDataGrid-columnHeaderTitle": {
                fontSize: isMobile
                  ? "0.7rem"
                  : isTablet
                  ? "0.75rem"
                  : "0.875rem",
                fontWeight: 600,
                whiteSpace: "normal",
                lineHeight: "1.2",
                overflow: "visible",
              },
            },
            "& .MuiDataGrid-columnSeparator": {
              display: isMobile ? "none" : "flex",
            },
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: "#fff",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "2px solid #e0e0e0",
            backgroundColor: "#fafafa",
            minHeight: isMobile ? "40px !important" : "52px !important",
            "& .MuiTablePagination-root": {
              width: "100%",
            },
            "& .MuiTablePagination-toolbar": {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingLeft: isMobile ? "8px" : "16px",
              paddingRight: isMobile ? "8px" : "16px",
              minHeight: isMobile ? "40px" : "52px",
            },
            "& .MuiTablePagination-spacer": {
              display: "none",
            },
            "& .MuiTablePagination-displayedRows": {
              fontSize: isMobile ? "0.7rem" : "0.875rem",
              margin: 0,
              marginLeft: "auto",
            },
            "& .MuiTablePagination-selectLabel": {
              fontSize: isMobile ? "0.7rem" : "0.875rem",
              margin: 0,
              marginRight: "8px",
            },
            "& .MuiTablePagination-select": {
              fontSize: isMobile ? "0.7rem" : "0.875rem",
              paddingRight: "24px",
            },
            "& .MuiTablePagination-actions": {
              marginLeft: isMobile ? "8px" : "20px",
              "& .MuiIconButton-root": {
                padding: isMobile ? "4px" : "8px",
              },
            },
          },
          "& .MuiDataGrid-row": {
            "&:hover": {
              backgroundColor: "#fafafa",
            },
            "&.Mui-selected": {
              backgroundColor: "#f5f5f5",
              "&:hover": {
                backgroundColor: "#eeeeee",
              },
            },
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-columnHeader:focus": {
            outline: "none",
          },
          // Action cell specific styling
          "& .MuiDataGrid-actionsCell": {
            gap: isMobile ? 0 : 0.5,
          },
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        pageSizeOptions={isMobile ? [5, 10, 25] : [10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight={true}
        density={isMobile ? "compact" : "comfortable"}
        rowHeight={isMobile ? 38 : isTablet ? 44 : 52}
        columnHeaderHeight={isMobile ? 40 : isTablet ? 44 : 56}
        disableColumnMenu
        disableColumnSelector
        sx={{
          fontSize: isMobile ? "0.7rem" : isTablet ? "0.8rem" : "0.875rem",
        }}
      />
    </Box>
  );
};

export default InvoiceDataGrid;
