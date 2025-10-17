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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import type { LineItem } from "./InvoiceEditor";
import { itemService } from "../../services/itemService";
import { toast } from "../../utils/toast";

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

  useEffect(() => {
    const loadItemImages = async () => {
      const imageMap: Record<string, string> = {};

      for (const item of availableItems) {
        try {
          // ✅ Backend se thumbnail fetch karo
          const url = await itemService.getPictureThumbnail(parseInt(item.id));
          imageMap[item.id] = url;
        } catch (error) {
          console.log(`No image for item ${item.id}`);
        }
      }

      setItemImages(imageMap);
    };

    if (availableItems.length > 0) {
      loadItemImages();
    }
  }, [availableItems]);

  // Calculate amount for a line item
  const calculateAmount = (qty: number, rate: number, discount: number) => {
    const subtotal = qty * rate;
    const discountAmount = (subtotal * discount) / 100;
    return Math.round((subtotal - discountAmount) * 100) / 100;
  };

  // Handle item selection
 const handleItemSelect = async (lineId: string, itemId: string) => {
  try {
    // ✅ First check if we have cached data
    let selectedItem = availableItems.find((item: any) => item.id === itemId);
    
    // ✅ If rate/discount missing, fetch full item details
    if (selectedItem && (!selectedItem.rate || selectedItem.rate === 0)) {
      console.log("📡 Fetching full item details for:", itemId);
      
      const fullItemDetails = await itemService.getById(parseInt(itemId));
      console.log("✅ Full item details:", fullItemDetails);
      
      // Update selected item with full details
      selectedItem = {
        ...selectedItem,
        rate: fullItemDetails.salesRate || 0,
        discountPct: fullItemDetails.discountPct || 0,
        description: fullItemDetails.description || "",
      };
      
      // Optional: Update cache for future use
      const updatedItems = availableItems.map((item: any) => 
        item.id === itemId 
          ? { ...item, rate: fullItemDetails.salesRate, discountPct: fullItemDetails.discountPct }
          : item
      );
      // You might need to pass setAvailableItems as prop to update cache
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

  // Handle field change
  const handleFieldChange = (
    lineId: string,
    field: keyof LineItem,
    value: any
  ) => {
    setLineItems(
      lineItems.map((line) => {
        if (line.id !== lineId) return line;

        const updatedLine = { ...line, [field]: value };

        // Recalculate amount if qty, rate, or discount changes
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

  // Add new row
  const handleAddRow = () => {
    const newId = String(Date.now()); // Use timestamp for unique ID
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

  // Copy row
  const handleCopyRow = () => {
    if (!selectedRowId) return;

    const rowToCopy = lineItems.find((item) => item.id === selectedRowId);
    if (!rowToCopy) return;

    const newId = String(Date.now());
    setLineItems([...lineItems, { ...rowToCopy, id: newId }]);
  };

  // Delete row
  const handleDeleteRow = () => {
    if (!selectedRowId) return;

    // Keep at least one row
    if (lineItems.length === 1) return;

    setLineItems(lineItems.filter((item) => item.id !== selectedRowId));
    setSelectedRowId(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${companyCurrency}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate subtotal
  const subTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  // Check if all items are valid
  const hasAnyValidItem = lineItems.some(
    (item) =>
      item.itemId && //
      item.itemName &&
      item.quantity > 0 &&
      item.rate >= 0
  );
  const hasAnyInvalidItem = lineItems.some(
    (item) =>
      !item.itemId || // ⚠️ Item is required
      (item.itemId && item.quantity === 0) ||
      (!item.itemId && item.quantity > 0)
  );

  return (
    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header - Fixed position */}
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
            <Tooltip title="Add Row (Alt+N)">
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
                sx={{ textTransform: "none" }}
              >
                {!isMobile && "Add Row"}
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

        {/* Table - With min-height to prevent jumping */}
        <TableContainer
          sx={{
            overflowX: "auto",
            minHeight: 200, // Prevent layout shift
          }}
        >
          <Table size={isMobile ? "small" : "medium"}>
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

                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={line.itemId}
                          onChange={(e) =>
                            handleItemSelect(line.id, e.target.value)
                          }
                          displayEmpty
                          error={hasError && !line.itemId}
                          MenuProps={{
                            PaperProps: {
                              style: { maxHeight: 300 },
                            },
                          }}
                        >
                          <MenuItem value="" disabled>
                            <em>Select item</em>
                          </MenuItem>
                          {availableItems.map((item: any) => (
                            <MenuItem key={item.id} value={item.id}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {/* ✅ Backend se loaded image ya placeholder */}
                                <Avatar
                                  src={itemImages[item.id] || undefined}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: itemImages[item.id]
                                      ? "transparent"
                                      : "primary.light",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {!itemImages[item.id] && item.name.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">
                                  {item.name}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={line.description}
                        onChange={(e) =>
                          handleFieldChange(
                            line.id,
                            "description",
                            e.target.value
                          )
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
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={line.rate || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            line.id,
                            "rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        error={line.rate < 0}
                        placeholder="0"
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
                    </TableCell>

                    <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Subtotal Row */}
              {!isMobile && (
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
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Validation Messages */}
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
              ⚠️ Add at least one line item with item selected and quantity &gt;
              0
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
      </CardContent>
    </Card>
  );
};

export default LineItemsGrid;
