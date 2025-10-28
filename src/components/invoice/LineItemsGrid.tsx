// src/components/invoice/LineItemsGrid.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
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
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import type { LineItem } from "./InvoiceEditor";
import { itemService } from "../../services/itemService";
import { toast } from "../../utils/toast";
import ItemEditorDialog from "../items/ItemEditorDialog";
import type { ItemFormData } from "../../types/itemTypes";

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
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [currentLineIdForNewItem, setCurrentLineIdForNewItem] = useState<string | null>(null);
  const [localAvailableItems, setLocalAvailableItems] = useState(availableItems);

  useEffect(() => {
    setLocalAvailableItems(availableItems);
  }, [availableItems]);

  // Keyboard shortcuts
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

  // Load item images
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

  const handleItemSelect = async (lineId: string, itemId: string) => {
    if (itemId === "__ADD_NEW_ITEM__") {
      setCurrentLineIdForNewItem(lineId);
      setIsAddItemDialogOpen(true);
      return;
    }

    try {
      let selectedItem = localAvailableItems.find((item: any) => item.id === itemId);
      
      if (selectedItem && (!selectedItem.rate || selectedItem.rate === 0)) {
        const fullItemDetails = await itemService.getById(parseInt(itemId));
        selectedItem = {
          ...selectedItem,
          rate: fullItemDetails.salesRate || 0,
          discountPct: fullItemDetails.discountPct || 0,
          description: fullItemDetails.description || "",
        };
      }

      if (!selectedItem) return;

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

  const handleSaveNewItem = async (formData: ItemFormData) => {
    try {
      if (!formData.itemName || formData.itemName.trim() === "") {
        toast.error("Item name is required");
        throw new Error("Item name is required");
      }

      if (formData.saleRate === undefined || formData.saleRate === null) {
        toast.error("Sale rate is required");
        throw new Error("Sale rate is required");
      }

      const itemPayload = {
        itemName: formData.itemName.trim(),
        description: formData.description?.trim() || "",
        saleRate: Number(formData.saleRate) || 0,
        discountPct: Number(formData.discountPct) || 0,
      };

      const savedItem = await itemService.create(itemPayload);

      const updatedItems = await itemService.getList();
      const transformedItems = updatedItems.map((item) => ({
        id: String(item.itemID),
        name: item.itemName,
        description: item.description || "",
        rate: item.salesRate || 0,
        discountPct: item.discountPct || 0,
      }));

      setLocalAvailableItems(transformedItems);

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
    setSelectedRowId(newId);
  };

  const handleCopyRow = () => {
    if (!selectedRowId) return;

    const rowToCopy = lineItems.find((item) => item.id === selectedRowId);
    if (!rowToCopy) return;

    const newId = String(Date.now());
    setLineItems([...lineItems, { ...rowToCopy, id: newId }]);
    setSelectedRowId(newId);
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
    (item) => item.itemId && item.itemName && item.quantity > 0 && item.rate >= 0
  );
  
  const hasAnyInvalidItem = lineItems.some(
    (item) =>
      !item.itemId ||
      (item.itemId && item.quantity === 0) ||
      (!item.itemId && item.quantity > 0)
  );

  // ✅ Render item select
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
                    width: 24,
                    height: 24,
                    bgcolor: itemImages[item.id] ? "transparent" : "primary.light",
                    fontSize: "0.75rem",
                  }}
                >
                  {!itemImages[item.id] && item.name.charAt(0)}
                </Avatar>
                <Typography variant="body2">{item.name}</Typography>
              </Box>
            </MenuItem>
          ))}

          <Divider />
          <MenuItem value="__ADD_NEW_ITEM__">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
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

  // ✅ RESPONSIVE LINE ITEM ROW (works for both mobile & desktop)
  const renderLineItem = (line: LineItem, index: number) => {
    const hasError =
      (line.itemId && line.quantity === 0) ||
      (!line.itemId && line.quantity > 0);

    return (
      <Paper
        key={line.id}
        elevation={selectedRowId === line.id ? 3 : 1}
        sx={{
          p: { xs: 2, sm: 2.5 },
          border: selectedRowId === line.id ? "2px solid" : "1px solid",
          borderColor: selectedRowId === line.id ? "primary.main" : "divider",
          borderRadius: 1,
          position: "relative",
          transition: "all 0.2s",
          cursor: "pointer",
          "&:hover": {
            boxShadow: 3,
            borderColor: "primary.light",
          },
        }}
        onClick={() => setSelectedRowId(line.id)}
      >
        {/* Row Number Badge */}
        <Chip
          label={`#${index + 1}`}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            height: 24,
            fontSize: "0.75rem",
            fontWeight: 700,
            bgcolor: selectedRowId === line.id ? "primary.main" : "grey.200",
            color: selectedRowId === line.id ? "white" : "text.primary",
          }}
        />

        {/* ✅ RESPONSIVE GRID - Auto stacks on mobile */}
        <Box sx={{ ml: { xs: 4, sm: 5 } }}>
          <Grid container spacing={2}>
            {/* Item Select - Full width on mobile, 6 cols on desktop */}
            <Grid size={{ xs: 12, sm: 3 }}>
              {renderItemSelect(line, hasError)}
            </Grid>

            {/* Description - Full width on mobile, 6 cols on desktop */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                value={line.description}
                onChange={(e) =>
                  handleFieldChange(line.id, "description", e.target.value)
                }
                multiline
                rows={isMobile ? 2 : 1}
                inputProps={{ maxLength: 500 }}
                placeholder="Item description..."
              />
            </Grid>

            {/* Quantity */}
            <Grid size={{ xs: 6, sm: 1 }}>
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
                 sx={{
                        // For Webkit browsers (Chrome, Safari, Edge)
                        "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                          {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        // For Firefox
                        "& input[type=number]": {
                          MozAppearance: "textfield",
                        },
                        // Previous styling for border-radius and height
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          "& input": {
                            height: "42px",
                            padding: "0 14px",
                          },
                        },
                      }}
              />
            </Grid>

            {/* Rate */}
            <Grid size={{ xs: 6, sm: 1.3 }}>
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
                 sx={{
                        // For Webkit browsers (Chrome, Safari, Edge)
                        "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                          {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        // For Firefox
                        "& input[type=number]": {
                          MozAppearance: "textfield",
                        },
                        // Previous styling for border-radius and height
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          "& input": {
                            height: "42px",
                            padding: "0 14px",
                          },
                        },
                      }}
              />
            </Grid>

            {/* Discount % */}
            <Grid size={{ xs: 6, sm: 1.6 }}>
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
                 sx={{
                        // For Webkit browsers (Chrome, Safari, Edge)
                        "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                          {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        // For Firefox
                        "& input[type=number]": {
                          MozAppearance: "textfield",
                        },
                        // Previous styling for border-radius and height
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          "& input": {
                            height: "42px",
                            padding: "0 14px",
                          },
                        },
                      }}
              />
            </Grid>

            {/* Amount - Read only */}
            <Grid size={{ xs: 6, sm: 2 }}>
              <Box
                sx={{
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  px:1,
                  height: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems:"center",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Amount
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {formatCurrency(line.amount)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
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
              Line Items ({lineItems.length})
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              {!isMobile && (
                <Tooltip title="Add Row (Alt+N)">
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
              )}

              <Tooltip title="Copy Selected Row">
                <IconButton
                  size="small"
                  onClick={handleCopyRow}
                  disabled={!selectedRowId}
                  sx={{ border: "1px solid #e0e0e0" }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Selected Row (Del)">
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

          {/* ✅ Line Items Stack - Auto responsive */}
          <Stack spacing={2}>
            {lineItems.map((line, index) => renderLineItem(line, index))}
          </Stack>

          {/* Subtotal */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body1" fontWeight={600}>
              Sub Total:
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatCurrency(subTotal)}
            </Typography>
          </Box>

          {/* Validation Messages */}
          {(hasAnyInvalidItem || !hasAnyValidItem) && (
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
          )}
        </CardContent>
      </Card>

      {/* ✅ Mobile FAB */}
      {isMobile && (
        <>
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
        </>
      )}

      {/* Item Editor Dialog */}
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
};

export default LineItemsGrid;