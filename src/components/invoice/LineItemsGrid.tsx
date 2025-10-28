// src/components/invoice/LineItemsGrid.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Avatar,
  Stack,
  Fab,
  InputLabel,
  Grid,
  Paper,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import type { LineItem } from "./InvoiceEditor";
import { itemService } from "../../services/itemService";
import { toast } from "../../utils/toast";
import ItemEditorDialog from "../items/ItemEditorDialog"; // ✅ Import ItemEditorDialog
import type { ItemFormData } from "../../types/itemTypes"; // ✅ Import types

interface LineItemsGridProps {
  lineItems: LineItem[];
  setLineItems: (items: LineItem[]) => void;
  companyCurrency: string;
  isMobile: boolean;
  availableItems: any;
}

const LineItemsGrid = ({
  lineItems,
  setLineItems,
  companyCurrency,
  isMobile,
  availableItems,
}: LineItemsGridProps) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  
  // ✅ NEW: State for Add Item Dialog
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [currentLineIdForNewItem, setCurrentLineIdForNewItem] = useState<string | null>(null);
  const [localAvailableItems, setLocalAvailableItems] = useState(availableItems);

  // ✅ Sync local items with parent
  useEffect(() => {
    setLocalAvailableItems(availableItems);
  }, [availableItems]);

  // Add keyboard shortcut for adding new row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === 'n') || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        handleAddRow();
      }
      if (e.key === 'Delete' && selectedRowId && lineItems.length > 1) {
        e.preventDefault();
        handleDeleteRow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowId, lineItems.length]);

  useEffect(() => {
    const loadItemImages = async () => {
      const imageMap: Record<string, string> = {};

      for (const item of localAvailableItems) {
        try {
          const url = await itemService.getPictureThumbnail(parseInt(item.id));
          imageMap[item.id] = url;
        } catch (error) {
          console.log(`No image for item ${item.id}`);
        }
      }

      setItemImages(imageMap);
    };

    if (localAvailableItems.length > 0) {
      loadItemImages();
    }
  }, [localAvailableItems]);

  const calculateAmount = (qty: number, rate: number, discount: number) => {
    const subtotal = qty * rate;
    const discountAmount = (subtotal * discount) / 100;
    return Math.round((subtotal - discountAmount) * 100) / 100;
  };

  // ✅ UPDATED: Handle item selection with "Add New Item" option
  const handleItemSelect = async (lineId: string, itemId: string) => {
    // ✅ Check if user clicked "Add New Item"
    if (itemId === "__ADD_NEW_ITEM__") {
      setCurrentLineIdForNewItem(lineId);
      setIsAddItemDialogOpen(true);
      return;
    }

    try {
      let selectedItem = localAvailableItems.find((item: any) => item.id === itemId);
      
      if (selectedItem && (!selectedItem.rate || selectedItem.rate === 0)) {
        console.log("📡 Fetching full item details for:", itemId);
        
        const fullItemDetails = await itemService.getById(parseInt(itemId));
        console.log("✅ Full item details:", fullItemDetails);
        
        selectedItem = {
          ...selectedItem,
          rate: fullItemDetails.salesRate || 0,
          discountPct: fullItemDetails.discountPct || 0,
          description: fullItemDetails.description || "",
        };
      }

      if (!selectedItem) {
        console.warn("Item not found:", itemId);
        return;
      }

      console.log("✅ Using item with rates:", selectedItem);
      
      const currentLine = lineItems.find(l => l.id === lineId);
      const currentQty = currentLine?.quantity || 1;
      
      setLineItems(
        lineItems.map((line) =>
          line.id === lineId
            ? {
                ...line,
                itemId: selectedItem.id,
                itemName: selectedItem.name,
                description: selectedItem.description || "",
                quantity: currentQty,
                rate: selectedItem.rate || 0,
                discountPct: selectedItem.discountPct || 0,
                amount: calculateAmount(
                  currentQty,
                  selectedItem.rate || 0,
                  selectedItem.discountPct || 0
                ),
              }
            : line
        )
      );
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Failed to load item details");
    }
  };

 // ✅ FIXED: Handle save new item from dialog
const handleSaveNewItem = async (formData: ItemFormData) => {
  try {
    console.log("💾 Saving new item from invoice editor...");
    console.log("📝 Received formData:", formData);

    // ✅ VALIDATE required fields first
    if (!formData.itemName || formData.itemName.trim() === "") {
      toast.error("Item name is required");
      throw new Error("Item name is required");
    }

    if (formData.saleRate === undefined || formData.saleRate === null) {
      toast.error("Sale rate is required");
      throw new Error("Sale rate is required");
    }

    // ✅ FIX: Send plain object, NOT FormData
    const itemPayload = {
      itemName: formData.itemName.trim(),
      description: formData.description?.trim() || "",
      saleRate: Number(formData.saleRate) || 0,
      discountPct: Number(formData.discountPct) || 0,
    };

    console.log("📤 Item payload to send:", itemPayload);

    // ✅ Save item (without image for now)
    const savedItem = await itemService.create(itemPayload);
    console.log("✅ Item saved successfully:", savedItem);

    // ✅ If there's an image, upload it separately
    if (formData.itemPicture && formData.itemPicture instanceof File) {
      try {
        console.log("📎 Uploading image for item:", savedItem.itemID);
        // await itemService.uploadPicture(savedItem.itemID, formData.itemPicture);
        console.log("✅ Image uploaded successfully");
      } catch (imageError) {
        console.error("❌ Image upload failed:", imageError);
        toast.warning("Item saved, but image upload failed");
      }
    }

    // ✅ Refresh items list
    const updatedItems = await itemService.getList();
    const transformedItems = updatedItems.map((item) => ({
      id: String(item.itemID),
      name: item.itemName,
      description: item.description || "",
      rate: item.salesRate || 0,
      discountPct: item.discountPct || 0,
    }));

    setLocalAvailableItems(transformedItems);

    // ✅ Auto-select the newly created item in the current line
    if (currentLineIdForNewItem) {
      const newItemId = String(savedItem.itemID);
      const newItem = transformedItems.find(item => item.id === newItemId);

      if (newItem) {
        const currentLine = lineItems.find(l => l.id === currentLineIdForNewItem);
        const currentQty = currentLine?.quantity || 1;

        setLineItems(
          lineItems.map((line) =>
            line.id === currentLineIdForNewItem
              ? {
                  ...line,
                  itemId: newItem.id,
                  itemName: newItem.name,
                  description: newItem.description || "",
                  quantity: currentQty,
                  rate: newItem.rate || 0,
                  discountPct: newItem.discountPct || 0,
                  amount: calculateAmount(
                    currentQty,
                    newItem.rate || 0,
                    newItem.discountPct || 0
                  ),
                }
              : line
          )
        );
      }
    }

    toast.success("Item added successfully!");
    setIsAddItemDialogOpen(false);
    setCurrentLineIdForNewItem(null);

    return { itemID: savedItem.itemID, updatedOn: savedItem.updatedOn };
  } catch (error: any) {
    console.error("❌ Failed to save item:", error);
    
    // ✅ Show user-friendly error
    if (error.message?.includes("already exists")) {
      toast.error("Item with this name already exists");
    } else if (error.message?.includes("required")) {
      toast.error(error.message);
    } else {
      toast.error("Failed to save item. Please try again.");
    }
    
    throw error;
  }
};

  const handleFieldChange = (
    lineId: string,
    field: keyof LineItem,
    value: any
  ) => {
    setLineItems(
      lineItems.map((line) => {
        if (line.id !== lineId) return line;

        const updatedLine = { ...line, [field]: value };

        if (["quantity", "rate", "discountPct"].includes(field)) {
          updatedLine.amount = calculateAmount(
            updatedLine.quantity,
            updatedLine.rate,
            updatedLine.discountPct
          );
        }

        return updatedLine;
      })
    );
  };

  const handleAddRow = () => {
    const newId = String(Date.now());
    setLineItems([
      ...lineItems,
      {
        id: newId,
        itemId: "",
        itemName: "",
        description: "",
        quantity: 1,
        rate: 0,
        discountPct: 0,
        amount: 0,
      },
    ]);
  };

  const handleCopyRow = () => {
    if (!selectedRowId) return;

    const rowToCopy = lineItems.find((item) => item.id === selectedRowId);
    if (!rowToCopy) return;

    const newId = String(Date.now());
    setLineItems([...lineItems, { ...rowToCopy, id: newId }]);
  };

  const handleDeleteRow = () => {
    if (!selectedRowId) return;
    if (lineItems.length === 1) return;

    setLineItems(lineItems.filter((item) => item.id !== selectedRowId));
    setSelectedRowId(null);
  };

  const formatCurrency = (amount: number) => {
    return `${companyCurrency}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const subTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const hasAnyValidItem = lineItems.some(
    (item) =>
      item.itemId &&
      item.itemName &&
      item.quantity > 0 &&
      item.rate >= 0
  );
  
  const hasAnyInvalidItem = lineItems.some(
    (item) =>
      !item.itemId ||
      (item.itemId && item.quantity === 0) ||
      (!item.itemId && item.quantity > 0)
  );

  // ✅ NEW: Render item select dropdown with "Add New Item" option
  const renderItemSelect = (line: LineItem, hasError: boolean) => {
    return (
      <FormControl fullWidth size="small">
        {isMobile && <InputLabel>Item *</InputLabel>}
        <Select
          value={line.itemId}
          onChange={(e) => handleItemSelect(line.id, e.target.value)}
          displayEmpty={!isMobile}
          label={isMobile ? "Item *" : undefined}
          error={hasError && !line.itemId}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 300 },
            },
          }}
        >
          {!isMobile && (
            <MenuItem value="" disabled>
              <em>Select item</em>
            </MenuItem>
          )}
          
          {localAvailableItems.map((item: any) => (
            <MenuItem key={item.id} value={item.id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  src={itemImages[item.id] || undefined}
                  sx={{
                    width: isMobile ? 24 : 32,
                    height: isMobile ? 24 : 32,
                    bgcolor: itemImages[item.id] ? "transparent" : "primary.light",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  {!itemImages[item.id] && item.name.charAt(0)}
                </Avatar>
                <Typography variant="body2">{item.name}</Typography>
              </Box>
            </MenuItem>
          ))}

          {/* ✅ Add New Item Option */}
          <Divider />
          <MenuItem value="__ADD_NEW_ITEM__">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 24 : 32 }}>
                <AddCircleOutlineIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Add New Item" 
                primaryTypographyProps={{ 
                  fontWeight: 600, 
                  color: "primary.main",
                  fontSize: "0.875rem" 
                }} 
              />
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <Box sx={{ position: "relative" }}>
        <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <CardContent sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                Line Items ({lineItems.length})
              </Typography>
              
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={handleCopyRow}
                  disabled={!selectedRowId}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDeleteRow}
                  disabled={!selectedRowId || lineItems.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Stack spacing={2}>
              {lineItems.map((line, index) => {
                const hasError =
                  (line.itemId && line.quantity === 0) ||
                  (!line.itemId && line.quantity > 0);

                return (
                  <Paper
                    key={line.id}
                    elevation={selectedRowId === line.id ? 3 : 1}
                    sx={{
                      p: 2,
                      border: selectedRowId === line.id ? "2px solid" : "1px solid",
                      borderColor: selectedRowId === line.id ? "primary.main" : "divider",
                      borderRadius: 1,
                      position: "relative",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setSelectedRowId(line.id)}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Box sx={{ ml: 4 }}>
                      <Grid container spacing={1.5}>
                        {/* ✅ Item Select with Add New Item */}
                        <Grid size={{xs:12}}>
                          {renderItemSelect(line, hasError)}
                        </Grid>

                        <Grid size={{xs:12}}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Description"
                            value={line.description}
                            onChange={(e) =>
                              handleFieldChange(line.id, "description", e.target.value)
                            }
                            multiline
                            rows={2}
                            inputProps={{ maxLength: 500 }}
                          />
                        </Grid>

                        <Grid size={{xs:6}}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Quantity *"
                            type="number"
                            value={line.quantity || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                line.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            error={hasError && line.quantity === 0}
                          />
                        </Grid>

                        <Grid size={{xs:6}}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Rate *"
                            type="number"
                            value={line.rate || ""}
                            onChange={(e) =>
                              handleFieldChange(line.id, "rate", parseFloat(e.target.value) || 0)
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            error={line.rate < 0}
                          />
                        </Grid>

                        <Grid size={{xs:6}}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Discount %"
                            type="number"
                            value={line.discountPct || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleFieldChange(
                                line.id,
                                "discountPct",
                                Math.max(0, Math.min(100, val))
                              );
                            }}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            error={line.discountPct < 0 || line.discountPct > 100}
                          />
                        </Grid>

                        <Grid size={{xs:6}}>
                          <Box
                            sx={{
                              bgcolor: "grey.100",
                              borderRadius: 1,
                              p: 1,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              Amount
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(line.amount)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>

            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: "grey.100",
                borderRadius: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" fontWeight="600">
                Sub Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(subTotal)}
              </Typography>
            </Box>

            {(hasAnyInvalidItem || !hasAnyValidItem) && (
              <Box sx={{ mt: 2 }}>
                {!hasAnyValidItem && (
                  <Typography
                    sx={{
                      color: "error.main",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    ⚠️ Add at least one line item with item selected and quantity &gt; 0
                  </Typography>
                )}

                {hasAnyInvalidItem && (
                  <Typography
                    sx={{
                      color: "warning.main",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: hasAnyValidItem ? 1 : 0,
                    }}
                  >
                    ⚠️ Item selection is mandatory for all line items
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Fab
          color="primary"
          aria-label="add row"
          onClick={handleAddRow}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>

        <Typography
          variant="caption"
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            bgcolor: "background.paper",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            boxShadow: 1,
            color: "text.secondary",
          }}
        >
          Alt+N
        </Typography>

        {/* ✅ Add Item Dialog */}
        <ItemEditorDialog
          open={isAddItemDialogOpen}
          mode="new"
          itemData={null}
          onClose={() => {
            setIsAddItemDialogOpen(false);
            setCurrentLineIdForNewItem(null);
          }}
          onSave={handleSaveNewItem}
        />
      </Box>
    );
  }

  // Desktop Layout
  return (
    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Line Items
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Add Row (Alt+N or Ctrl+Enter)">
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
                sx={{ textTransform: "none" }}
              >
                Add Row
              </Button>
            </Tooltip>

            <Tooltip title="Copy Row">
              <IconButton
                size="small"
                onClick={handleCopyRow}
                disabled={!selectedRowId}
                sx={{ border: "1px solid #e0e0e0" }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Row (Del)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDeleteRow}
                  disabled={!selectedRowId || lineItems.length === 1}
                  sx={{ border: "1px solid #e0e0e0" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <TableContainer sx={{ overflowX: "auto", minHeight: 200 }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#fafafa" }}>
                <TableCell sx={{ width: 50, fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 600 }}>
                  Item<span style={{ color: "red" }}>*</span>
                </TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 600 }}>
                  Description
                </TableCell>
                <TableCell sx={{ width: 100, fontWeight: 600 }}>
                  Qty<span style={{ color: "red" }}>*</span>
                </TableCell>
                <TableCell sx={{ width: 120, fontWeight: 600 }}>
                  Rate<span style={{ color: "red" }}>*</span>
                </TableCell>
                <TableCell sx={{ width: 100, fontWeight: 600 }}>
                  Disc %
                </TableCell>
                <TableCell
                  sx={{ width: 130, fontWeight: 600, textAlign: "right" }}
                >
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((line, index) => {
                const hasError =
                  (line.itemId && line.quantity === 0) ||
                  (!line.itemId && line.quantity > 0);

                return (
                  <TableRow
                    key={line.id}
                    selected={selectedRowId === line.id}
                    onClick={() => setSelectedRowId(line.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                      "&.Mui-selected": {
                        backgroundColor: "#e3f2fd",
                        "&:hover": { backgroundColor: "#bbdefb" },
                      },
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>

                    {/* ✅ Item Select with Add New Item */}
                    <TableCell>
                      {renderItemSelect(line, hasError)}
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={line.description}
                        onChange={(e) =>
                          handleFieldChange(line.id, "description", e.target.value)
                        }
                        inputProps={{ maxLength: 500 }}
                        placeholder="Item description"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={line.quantity || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            line.id,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        error={hasError && line.quantity === 0}
                        placeholder="0"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={line.rate || ""}
                        onChange={(e) =>
                          handleFieldChange(line.id, "rate", parseFloat(e.target.value) || 0)
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        error={line.rate < 0}
                        placeholder="0"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={line.discountPct || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleFieldChange(
                            line.id,
                            "discountPct",
                            Math.max(0, Math.min(100, val))
                          );
                        }}
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                        error={line.discountPct < 0 || line.discountPct > 100}
                        placeholder="0"
                      />
                    </TableCell>

                    <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow sx={{ backgroundColor: "#fafafa" }}>
                <TableCell
                  colSpan={6}
                  sx={{ textAlign: "right", fontWeight: 600 }}
                >
                  Sub Total:
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: "right",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  {formatCurrency(subTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2 }}>
          {!hasAnyValidItem && (
            <Typography
              sx={{
                color: "error.main",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              ⚠️ Add at least one line item with item selected and quantity &gt; 0
            </Typography>
          )}

          {hasAnyInvalidItem && (
            <Typography
              sx={{
                color: "warning.main",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mt: hasAnyValidItem ? 1 : 0,
              }}
            >
              ⚠️ Item selection is mandatory for all line items
            </Typography>
          )}
        </Box>

        {/* ✅ Add Item Dialog */}
        <ItemEditorDialog
          open={isAddItemDialogOpen}
          mode="new"
          itemData={null}
          onClose={() => {
            setIsAddItemDialogOpen(false);
            setCurrentLineIdForNewItem(null);
          }}
          onSave={handleSaveNewItem}
        />
      </CardContent>
    </Card>
  );
};

export default LineItemsGrid;