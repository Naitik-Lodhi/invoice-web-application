// src/pages/ItemListPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ActionBar from "../components/ActionBar";
import ItemDataGrid from "../components/items/ItemDataGrid";
import ItemEditorDialog from "../components/items/ItemEditorDialog";
import type { Item, ItemFormData } from "../types/itemTypes";
import type { Column } from "../components/ActionBar";
import { exportItemsToExcel } from "../utils/exportData";
import { useAuth } from "../context/AuthContext";
import { itemService } from "../services/itemService";
import { toast } from "../utils/toast";
import axiosInstance from "../api/axiosInstance";

const ItemListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { company } = useAuth();
  const companyCurrency = company?.currencySymbol || "$";

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"new" | "edit">("new");
  const [editingItem, setEditingItem] = useState<Item | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Column visibility
  const getInitialColumnVisibility = (): Column[] => [
    { field: "itemPicture", headerName: "Picture", visible: !isMobile },
    { field: "itemName", headerName: "Item Name", visible: true },
    { field: "description", headerName: "Description", visible: !isMobile },
    { field: "saleRate", headerName: "Sale Rate", visible: true },
    { field: "discountPct", headerName: "Discount %", visible: !isMobile },
    { field: "actions", headerName: "Actions", visible: true },
  ];

  const [columnVisibility, setColumnVisibility] = useState<Column[]>(
    getInitialColumnVisibility
  );

  // Update column visibility on mobile change
  useEffect(() => {
    setColumnVisibility(getInitialColumnVisibility());
  }, [isMobile]);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itemService.getList();
      const transformedItems = data.map((item: any) => ({
        ...item,
        id: item.itemID,
        salesRate: item.salesRate || 0,
        createdAt: new Date(item.createdOn),
        updatedAt: new Date(item.updatedOn || item.createdOn),
      }));

      setItems(transformedItems);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower)
    );
  });

  // Handle column visibility change
  const handleColumnVisibilityChange = (field: string, visible: boolean) => {
    setColumnVisibility((prev) =>
      prev.map((col) => (col.field === field ? { ...col, visible } : col))
    );
  };

  // Handle new item
  const handleNewItem = () => {
    setEditorMode("new");
    setEditingItem(undefined);
    setEditorOpen(true);
  };

  // Handle edit item
  const handleEditItem = (id: string | number) => {
    const itemId = typeof id === "string" ? parseInt(id, 10) : id;
    const item = items.find((i) => i.itemID === itemId);
    if (item) {
      setEditorMode("edit");
      setEditingItem(item);
      setEditorOpen(true);
    }
  };

  // Handle delete item
  const handleDeleteItem = (id: string | number) => {
    const itemId = typeof id === "string" ? parseInt(id, 10) : id;
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  // ✅ FIXED: Confirm delete with proper error messages
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await itemService.delete(itemToDelete);

      // Remove from state
      setItems((prev) => prev.filter((item) => item.itemID !== itemToDelete));

      toast.success("Item deleted successfully");
    } catch (error: any) {
      console.error("❌ Delete error:", error);

      // ✅ Check for specific error messages
      const errorMessage = error.response?.data || error.message;

      if (
        typeof errorMessage === "string" &&
        errorMessage.toLowerCase().includes("exists in invoices")
      ) {
        toast.error(
          "Cannot delete item. This item is used in one or more invoices.",
          { autoHideDuration: 5000 }
        );
      } else if (error.response?.status === 400) {
        toast.error(errorMessage || "Cannot delete item. It may be in use.", {
          autoHideDuration: 5000,
        });
      } else {
        toast.error("Failed to delete item");
      }
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // ✅ FIXED: Handle save item with proper error handling and state update
  const handleSaveItem = async (data: ItemFormData) => {
    try {
      let itemID = editingItem?.itemID || 0;

      // Prepare item data
      const itemData = {
        itemName: data.itemName.trim(),
        description: data.description?.trim() || "",
        saleRate: data.saleRate,
        discountPct: data.discountPct || 0,
      };

      let response: any;

      if (editorMode === "new") {
        response = await itemService.create(itemData);
        itemID = response.itemID;
      } else {
        // ✅ Send updatedOnPrev for concurrency check
        response = await itemService.update(itemID, {
          ...itemData,
          updatedOnPrev: editingItem?.updatedOn || null,
        });
      }

      // Handle picture upload if provided
      if (data.itemPicture instanceof File) {
        try {
          const formData = new FormData();
          formData.append("ItemID", String(itemID));
          formData.append("Picture", data.itemPicture);

          await axiosInstance.post("/Item/UpdateItemPicture", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (picError) {
          console.error("Picture upload failed:", picError);
          toast.warning("Item saved but picture upload failed");
        }
      }

      // ✅ CRITICAL: Refresh the items list to get updated timestamp
      await fetchItems();

      toast.success(
        editorMode === "new"
          ? "Item created successfully"
          : "Item updated successfully"
      );

      // ✅ Close the dialog
      handleCloseEditor();
    } catch (error: any) {
      console.error("❌ Save error:", error);

      // ✅ Handle specific error cases
      const errorMessage =
        error.response?.data?.error || error.response?.data || error.message;

      if (error.response?.status === 409) {
        // Duplicate name
        if (
          typeof errorMessage === "string" &&
          errorMessage.toLowerCase().includes("already exists")
        ) {
          throw new Error(
            "Item name already exists. Please use a different name."
          );
        }
        throw new Error(
          "Item name already exists. Please use a different name."
        );
      } else if (error.response?.status === 412) {
        // Concurrency conflict
        throw new Error(
          "This item was modified by another user. Please close and reopen to get the latest data."
        );
      } else if (
        typeof errorMessage === "string" &&
        errorMessage.toLowerCase().includes("modified by another user")
      ) {
        throw new Error(
          "This item was modified by another user. Please close and reopen to get the latest data."
        );
      }

      toast.error(errorMessage || "Failed to save item");
      throw new Error(errorMessage || "Failed to save item");
    }
  };

  // Handle export
  const handleExport = () => {
    exportItemsToExcel(filteredItems, companyCurrency);
  };

  // Handle close editor
  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingItem(undefined);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "2rem" },
            color: "#171717",
            mb: 0.5,
          }}
        >
          Items
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#666",
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Manage your product and service catalog
        </Typography>
      </Box>

      {/* Action Bar */}
      <Box sx={{ mb: 2 }}>
        <ActionBar
          searchText={searchText}
          onSearchChange={setSearchText}
          onNewInvoice={handleNewItem}
          onExport={handleExport}
          columns={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          totalRecords={filteredItems.length}
          buttonName="New Item"
          searchBarPlaceholder="Search items..."
           isExportDisabled={filteredItems.length === 0 || loading}
        />
      </Box>

      {/* Data Grid */}
      <Box sx={{ height: 600, width: "100%" }}>
        <ItemDataGrid
          items={filteredItems}
          visibleColumns={columnVisibility
            .filter((c) => c.visible)
            .map((c) => c.field)}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          loading={loading}
          searchText={searchText}
          companyCurrency={companyCurrency}
        />
      </Box>

      {/* Item Editor Dialog */}
      <ItemEditorDialog
        open={editorOpen}
        mode={editorMode}
        itemData={editingItem}
        onClose={handleCloseEditor}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? This action cannot be
            undone.
          </Typography>
          <Typography sx={{ mt: 2, color: "#666", fontSize: "0.875rem" }}>
            Note: Items that are used in invoices cannot be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              "&:hover": { bgcolor: "#dc2626" },
              textTransform: "none",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemListPage;
