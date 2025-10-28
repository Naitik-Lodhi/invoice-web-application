// src/components/items/ItemDataGrid.tsx
import {
  Box,
  Avatar,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  GridActionsCellItem,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import { useState, useMemo, useEffect } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Item, ItemDataGridProps } from "../../types/itemTypes";
import { itemService } from "../../services/itemService";

const ItemDataGrid = ({
  items,
  visibleColumns,
  onEdit,
  onDelete,
  loading = false,
  companyCurrency = "$",
}: ItemDataGridProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  // Load all images at once
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<number, string> = {};
      const loadingSet = new Set<number>();

      // Load images in parallel
      const promises = items.map(async (item) => {
        loadingSet.add(item.itemID);
        try {
          const url = await itemService.getPictureThumbnail(item.itemID);
          urls[item.itemID] = url;
        } catch (error) {
          // No image exists, will show initials
        }
      });

      setLoadingImages(loadingSet);
      await Promise.all(promises);
      setImageUrls(urls);
      setLoadingImages(new Set());
    };

    if (items.length > 0) {
      loadImages();
    }
  }, [items]);

  // Get initials from item name
  const getInitials = (name: string): string => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "?";
    }
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || typeof amount !== "number") {
      return `${companyCurrency}0.00`;
    }

    if (isMobile && amount >= 1000) {
      if (amount >= 1000000) {
        return `${companyCurrency}${(amount / 1000000).toFixed(1)}M`;
      }
      return `${companyCurrency}${Math.round(amount / 1000)}K`;
    }

    return `${companyCurrency}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Define columns
  const columns: GridColDef[] = useMemo(() => {
    const columnConfigs: Record<string, Partial<GridColDef>> = {
      itemPicture: {
        field: "itemPicture",
        headerName: isMobile ? "" : "Picture",
        width: isMobile ? 40 : 70,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => {
          const itemName = params.row.itemName;
          const pictureUrl = imageUrls[params.row.itemID];
          const initials = getInitials(itemName);
          const isLoading = loadingImages.has(params.row.itemID);

          return (
            <Avatar
              src={pictureUrl || undefined}
              sx={{
                width: isMobile ? 32 : 50,
                height: isMobile ? 32 : 50,
                bgcolor: pictureUrl ? "transparent" : "primary.light",
                opacity: isLoading ? 0.5 : 1,
                mt:1,
                mb:1
              }}
            >
              {!pictureUrl && initials}
            </Avatar>
          );
        },
      },
      itemName: {
        field: "itemName",
        headerName: isMobile ? "Item" : "Item Name",
        flex: isMobile ? 1 : 1.2,
        minWidth: isMobile ? 100 : 150,
        renderCell: (params: GridRenderCellParams<Item>) => {
          if (isMobile && !visibleColumns.includes("description")) {
            return (
              <Box sx={{ py: 0.5 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: "#171717",
                    lineHeight: 1.2,
                    mt:3
                  }}
                >
                  {params.row.itemName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "#666",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    mt:2
                  }}
                >
                  {truncateText(params.row.description || "", 30)}
                </Typography>
              </Box>
            );
          }

          return (
            <Typography
              sx={{
                fontWeight: 700,
                color: "#171717",
                fontSize: isTablet ? "0.8rem" : "0.875rem",
                textAlign:"left",
                mt:2.5
              }}
            >
              {params.row.itemName}
            </Typography>
          );
        },
      },
      description: {
        field: "description",
        headerName: "Description",
        flex: 2,
        minWidth: 200,
        renderCell: (params: GridRenderCellParams<Item>) => {
          const description = params.row.description || "";
          const maxLength = isMobile ? 20 : isTablet ? 40 : 50;

          return (
            <Tooltip
              title={description}
              arrow
              placement="top"
              disableHoverListener={
                !description || description.length <= maxLength
              }
            >
              <Typography
                sx={{
                  fontSize: isTablet ? "0.75rem" : "0.875rem",
                  color: "#666",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: description.length > maxLength ? "help" : "default",
                  mt:2.5
                }}
              >
                {truncateText(description, maxLength)}
              </Typography>
            </Tooltip>
          );
        },
      },
      saleRate: {
        field: "salesRate",
        headerName: "Sale Rate",
        width: isMobile ? 80 : 130,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<Item>) => (
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: isTablet ? "0.8rem" : "0.875rem",
              color: "#171717",
              mt:2.5
            }}
          >
            {formatCurrency(params.row.salesRate)}
          </Typography>
        ),
      },
      discountPct: {
        field: "discountPct",
        headerName: "Discount %",
        width: isMobile ? 70 : 120,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<Item>) => {
          const discount = params.row.discountPct;
          const displayValue = (
            typeof discount === "number" ? discount : 0
          ).toFixed(isMobile ? 0 : 2);

          return (
            <Typography
              sx={{
                fontSize: isTablet ? "0.8rem" : "0.875rem",
                color: discount > 0 ? "#059669" : "#666",
                fontWeight: discount > 0 ? 600 : 400,
                mt:2.5
              }}
            >
              {displayValue}%
            </Typography>
          );
        },
      },
      actions: {
        field: "actions",
        headerName: "Actions",
        width: isMobile ? 80 : 120,
        sortable: false,
        filterable: false,
        type: "actions",
        headerAlign: "center",
        getActions: (params) => [
          <Tooltip title="Edit Item" key="edit">
            <GridActionsCellItem
              icon={<EditIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
              label="Edit"
              onClick={() => onEdit(params.row.itemID)}
              showInMenu={false}
            />
          </Tooltip>,
          <Tooltip title="Delete Item" key="delete">
            <GridActionsCellItem
              icon={
                <DeleteIcon
                  color="error"
                  sx={{ fontSize: isMobile ? 18 : 20 }}
                />
              }
              label="Delete"
              onClick={() => onDelete(params.row.itemID)}
              showInMenu={false}
            />
          </Tooltip>,
        ],
      },
    };

    return visibleColumns
      .map((field) => columnConfigs[field])
      .filter(Boolean) as GridColDef[];
  }, [
    isMobile,
    isTablet,
    companyCurrency,
    onEdit,
    onDelete,
    visibleColumns,
    imageUrls,
    loadingImages,
  ]);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        "& .MuiDataGrid-root": {
          border: "none",
          fontSize: isMobile ? "0.7rem" : "0.875rem",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f0f0f0",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#fafafa",
            borderBottom: "2px solid #e0e0e0",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "2px solid #e0e0e0",
            backgroundColor: "#fafafa",
          },
        },
      }}
    >
      <DataGrid
        rows={items}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.itemID}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        // pageSizeOptions={isMobile ? [5, 10, 25] : [10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight={false}
        density={isMobile ? "compact" : "comfortable"}
        rowHeight={isMobile ? 60 : 62}
        disableColumnMenu
        disableColumnSelector
        sx={{
          textAlign:"center"
        }}
      />
    </Box>
  );
};

export default ItemDataGrid;
