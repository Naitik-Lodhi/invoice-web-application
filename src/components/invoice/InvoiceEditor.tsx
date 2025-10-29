// src/components/invoice/InvoiceEditor.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm } from "react-hook-form";
import InvoiceDetailsSection from "./InvoiceDetailsSection";
import LineItemsGrid from "./LineItemsGrid";
import TotalsPanel from "./TotalsPanel";
import { invoiceService } from "../../services/invoiceService";
import { itemService } from "../../services/itemService";
import { toast } from "../../utils/toast";
import dayjs from "dayjs";
import { FormErrorBoundary } from "../../error/ErrorBoundary";

// Types
export interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  quantity: number;
  rate: number;
  discountPct: number;
  amount: number;
}

export interface InvoiceFormData {
  invoiceNo: string;
  invoiceDate: Date;
  customerName: string;
  city: string;
  address: string;
  taxPercent: number;
  notes: string;
  lineItems: LineItem[];
  subTotal: number;
  taxAmount: number;
  invoiceAmount: number;
  updatedOn?: string;
}

// ✅ API payload (string date for backend)
export interface InvoicePayload {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  city: string;
  address: string;
  notes: string;
  lineItems: LineItem[];
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  invoiceAmount: number;
  updatedOn: string | null;
}

export interface InvoiceEditorProps {
  open: boolean;
  mode: "new" | "edit";
  invoiceId?: string;
  onClose: () => void;
  onSave: (
    data: InvoicePayload
  ) => Promise<{ invoiceID: string; updatedOn: string }>;
  companyCurrency?: string;
  nextInvoiceNumber?: number;
}

const InvoiceEditor = ({
  open,
  mode,
  invoiceId,
  onClose,
  onSave,
  companyCurrency = "$",
  nextInvoiceNumber = 1,
}: InvoiceEditorProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [saving, setSaving] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [concurrencyError, setConcurrencyError] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // ✅ NEW: State to track current updatedOn
  const [currentUpdatedOn, setCurrentUpdatedOn] = useState<string | null>(null);

  // Default values function
  const getDefaultValues = (): InvoiceFormData => ({
    invoiceNo: "",
    invoiceDate: new Date(),
    customerName: "",
    city: "",
    address: "",
    notes: "",
    lineItems: [],
    subTotal: 0,
    taxPercent: 0,
    taxAmount: 0,
    invoiceAmount: 0,
  });

  // Form control
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, touchedFields },
  } = useForm<InvoiceFormData>({
    mode: "onChange",
    defaultValues: getDefaultValues(),
  });

  // Watch for changes in edit mode
  useEffect(() => {
    if (mode === "edit" && invoiceId) {
      const subscription = watch(() => {
        setHasChanges(true);
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, mode, invoiceId]);

  // Load available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await itemService.getList();
        console.log("📦 Full items from backend:", items);

        const transformed = items.map((item) => ({
          id: String(item.itemID),
          name: item.itemName,
          description: item.description || "",
          rate: item.salesRate || 0,
          discountPct: item.discountPct || 0,
        }));

        console.log("🔄 Transformed items with rates:", transformed);
        setAvailableItems(transformed);
      } catch (error) {
        console.error("Failed to load items:", error);
        toast.error("Failed to load items");
      }
    };

    if (open) {
      fetchItems();
    }
  }, [open]);

  // Load invoice for editing
  const getInvoiceById = useCallback(async () => {
    if (mode !== "edit" || !invoiceId || !open) return;

    try {
      const response = await invoiceService.getById(invoiceId as any);
      console.log("📦 FULL GET Response:", response);
      console.log("📦 All fields in response:", Object.keys(response));
      console.log("📦 updatedOn value:", response.updatedOn);
      console.log("📦 UpdatedOn value:", response.updatedOn); // Capital U?
      console.log("📦 updatedon value:", response.updatedOn); // lowercase?
      console.log("📦 updatedOnPrev value:", response.updatedOn);

      // ✅ IMPORTANT: Store updatedOn for concurrency control
      console.log("📄 Invoice loaded:", {
        invoiceID: response.invoiceID,
        updatedOn: response.updatedOn,
      });
      setCurrentUpdatedOn(response.updatedOn || null);

      // Map line items with proper item names
      const items: LineItem[] = (response.lines || []).map((li, idx) => {
        const quantity = Number(li.quantity || 0);
        const rate = Number(li.rate || 0);
        const discountPct = Number(li.discountPct || 0);

        const fullItem = availableItems.find(
          (item) => item.id === String(li.itemID)
        );

        const discountMultiplier = 1 - discountPct / 100;
        const calculatedAmount =
          Math.round(quantity * rate * discountMultiplier * 100) / 100;

        return {
          id: String((li as any).invoiceItemID || idx + 1),
          itemId: String(li.itemID || ""),
          itemName: fullItem?.name || "",
          description: li.description || "",
          quantity: quantity,
          rate: rate,
          discountPct: discountPct,
          amount: calculatedAmount,
        };
      });

      // Date handling - preserve original date
      const invoiceDate = response.invoiceDate
        ? dayjs(response.invoiceDate).toDate()
        : new Date();

      reset({
        invoiceNo: String(response.invoiceNo || ""),
        invoiceDate: invoiceDate,
        customerName: response.customerName || "",
        city: response.city || "",
        address: response.address || "",
        notes: response.notes || "",
        lineItems: items,
        subTotal: Number(response.subTotal || 0),
        taxPercent: Number(response.taxPercentage || 0),
        taxAmount: Number(response.taxAmount || 0),
        invoiceAmount: Number(response.invoiceAmount || 0),
      });

      setLineItems(items);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to load invoice:", err);
      toast.error("Failed to load invoice");
    }
  }, [mode, invoiceId, open, reset, availableItems]);

  // Load invoice when available items are ready
  useEffect(() => {
    if (open && mode === "edit" && invoiceId && availableItems.length > 0) {
      getInvoiceById();
    }
  }, [open, mode, invoiceId, availableItems, getInvoiceById]);

  // Reset form for new invoice
  useEffect(() => {
    if (open && mode === "new") {
      reset(getDefaultValues());
      setLineItems([
        {
          id: String(Date.now()),
          itemId: "",
          itemName: "",
          description: "",
          quantity: 1,
          rate: 0,
          discountPct: 0,
          amount: 0,
        },
      ]);
      setValue("invoiceNo", String(nextInvoiceNumber));
      setHasChanges(false);
      setCurrentUpdatedOn(null); // ✅ Clear updatedOn for new invoice
    }
  }, [open, mode, nextInvoiceNumber, reset, setValue]);

  // Watch required fields
  const customerName = watch("customerName");
  const invoiceNo = watch("invoiceNo");
  const invoiceDate = watch("invoiceDate");
  const taxPercent = watch("taxPercent") || 0;
  const taxAmount = watch("taxAmount") || 0;

  // Calculate totals
  const subTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const invoiceAmount = subTotal + taxAmount;

  // Update form values when line items change
  useEffect(() => {
    setValue("subTotal", subTotal);
    if (taxPercent > 0 && subTotal > 0) {
      const calculatedTaxAmount =
        Math.round(((subTotal * taxPercent) / 100) * 100) / 100;
      setValue("taxAmount", calculatedTaxAmount);
    }
  }, [subTotal, setValue, taxPercent]);

  // Update invoice amount
  useEffect(() => {
    setValue("invoiceAmount", invoiceAmount);
  }, [invoiceAmount, setValue]);

  // Tax handlers
  const handleTaxPercentChange = (value: number) => {
    const newTaxPercent = Math.max(0, Math.min(100, value));
    setValue("taxPercent", newTaxPercent);

    if (subTotal > 0) {
      const calculatedTaxAmount =
        Math.round(((subTotal * newTaxPercent) / 100) * 100) / 100;
      setValue("taxAmount", calculatedTaxAmount);
    } else {
      setValue("taxAmount", 0);
    }
  };

  const handleTaxAmountChange = (value: number) => {
    const newTaxAmount = Math.max(0, value);
    setValue("taxAmount", newTaxAmount);

    if (subTotal > 0) {
      const calculatedTaxPercent =
        Math.round(((newTaxAmount * 100) / subTotal) * 100) / 100;
      setValue("taxPercent", calculatedTaxPercent);
    } else {
      setValue("taxPercent", 0);
    }
  };

  // Validation
  const hasValidLineItems = lineItems.some(
    (item) =>
      item.itemId && item.itemName && item.quantity > 0 && item.rate >= 0
  );

  const isFormValid =
    isValid &&
    invoiceNo &&
    invoiceDate &&
    customerName &&
    customerName.trim().length > 0 &&
    hasValidLineItems &&
    (mode === "new" || hasChanges) &&
    !saving;

  // Handle save
  const onSubmit = async (data: InvoiceFormData) => {
    if (!customerName || customerName.trim().length === 0) {
      toast.error("Customer name is required");
      return;
    }

    if (!hasValidLineItems) {
      toast.error("At least one valid line item is required");
      return;
    }

    setSaving(true);
    setConcurrencyError(false);

    try {
      const formattedDate = dayjs(data.invoiceDate).format("YYYY-MM-DD");

      const payload: InvoicePayload = {
        invoiceNo: data.invoiceNo,
        invoiceDate: formattedDate,
        customerName: data.customerName,
        city: data.city,
        address: data.address,
        notes: data.notes,
        lineItems,
        subTotal,
        taxPercent,
        taxAmount,
        invoiceAmount,
        updatedOn: mode === "edit" ? currentUpdatedOn : null,
      };

      console.log("💾 Submitting payload:", {
        mode,
        invoiceId,
        currentUpdatedOn,
        updatedOnPrev: payload.updatedOn,
      });

      const result = await onSave(payload);

      console.log("✅ Save completed, result:", result);

      // ✅ CRITICAL: Update state with new updatedOn
      if (result?.updatedOn) {
        console.log("🔄 Updating updatedOn:", {
          old: currentUpdatedOn,
          new: result.updatedOn,
        });
        setCurrentUpdatedOn(result.updatedOn);
        setHasChanges(false);

        if (mode === "edit") {
          toast.success("Invoice updated successfully");
        }
      } else {
        console.warn("⚠️ No updatedOn in result:", result);
      }

      // Close editor for new invoices
      if (mode === "new") {
        reset(getDefaultValues());
        setLineItems([]);
        setCurrentUpdatedOn(null);
        onClose();
      }
    } catch (error: any) {
      console.error("❌ Save failed:", error);

      if (error.response?.status === 409 || error.response?.status === 412) {
        setConcurrencyError(true);
        toast.error(
          error.message || "This record was modified by someone else"
        );
        // Reload invoice to get latest data
        if (mode === "edit") {
          await getInvoiceById();
        }
      } else {
        toast.error(error.message || "Failed to save invoice");
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle close
  const handleClose = () => {
    reset(getDefaultValues());
    setLineItems([]);
    setHasChanges(false);
    setConcurrencyError(false);
    setCurrentUpdatedOn(null); // ✅ Clear updatedOn on close
    onClose();
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter" && isFormValid) {
        handleSubmit(onSubmit)();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isFormValid, handleSubmit, onSubmit]);

  return (
    <FormErrorBoundary>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? "100vh" : "90vh",
            maxHeight: isMobile ? "100vh" : "90vh",
            m: isMobile ? 0 : 2,
          },
        }}
      >
        {/* Header */}
        <AppBar
          sx={{
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            color: "black",
            boxShadow: 1,
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            <Typography
              variant="h6"
              sx={{
                flex: 1,
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              {mode === "new" ? "New Invoice" : "Edit Invoice"}
            </Typography>

            {isMobile ? (
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleClose}
                disabled={saving}
              >
                <CloseIcon />
              </IconButton>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  disabled={saving}
                  size="small"
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isFormValid}
                  size="small"
                  sx={{
                    bgcolor: "black",
                    "&:hover": { bgcolor: "#333" },
                    "&:disabled": { bgcolor: "#e0e0e0", color: "#9e9e9e" },
                  }}
                >
                  {saving ? <CircularProgress size={18} /> : "Save"}
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Content - NO SCROLL */}
        <DialogContent
          sx={{
            p: { xs: 1, sm: 2 },
            backgroundColor: "#fafafa",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // ✅ No scroll on main container
            height: "calc(100% - 64px)", // Account for header
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1, sm: 2 },
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* 1. Invoice Details - Compact */}
            <Box sx={{ flexShrink: 0 }}>
              <InvoiceDetailsSection
                control={control}
                errors={errors}
                isMobile={isMobile}
              />
            </Box>

            {/* 2. Line Items - Scrollable Section */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto", // ✅ Only line items scroll
                minHeight: 0,
              }}
            >
              <LineItemsGrid
                lineItems={lineItems}
                setLineItems={setLineItems}
                companyCurrency={companyCurrency}
                isMobile={isMobile}
                availableItems={availableItems}
              />
            </Box>

            {/* 3. Totals Panel - Compact & Fixed */}
            <Box sx={{ flexShrink: 0 }}>
              <TotalsPanel
                subTotal={subTotal}
                taxPercent={taxPercent}
                taxAmount={taxAmount}
                invoiceAmount={invoiceAmount}
                onTaxPercentChange={handleTaxPercentChange}
                onTaxAmountChange={handleTaxAmountChange}
                companyCurrency={companyCurrency}
                isMobile={isMobile}
              />
            </Box>

            {/* Validation Summary - Compact */}
            {!isFormValid && (customerName || touchedFields.customerName) && (
              <Box
                sx={{
                  flexShrink: 0,
                  p: 1.5,
                  bgcolor: "#fff3cd",
                  borderRadius: 1,
                  border: "1px solid #ffc107",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#856404", mb: 0.5 }}
                >
                  Please complete:
                </Typography>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2, color: "#856404", fontSize: "0.75rem" }}
                >
                  {!invoiceNo && (
                    <Typography component="li" variant="caption">
                      Invoice number
                    </Typography>
                  )}
                  {!invoiceDate && (
                    <Typography component="li" variant="caption">
                      Invoice date
                    </Typography>
                  )}
                  {(!customerName || customerName.trim().length === 0) && (
                    <Typography component="li" variant="caption">
                      Customer name
                    </Typography>
                  )}
                  {!hasValidLineItems && (
                    <Typography component="li" variant="caption">
                      At least one valid line item
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Concurrency Error - Compact */}
            {concurrencyError && (
              <Box
                sx={{
                  flexShrink: 0,
                  p: 1.5,
                  bgcolor: "#fee2e2",
                  borderRadius: 1,
                  border: "1px solid #ef4444",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#991b1b", mb: 0.5 }}
                >
                  ⚠️ Concurrency Conflict
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#991b1b", display: "block", mb: 1 }}
                >
                  Modified by another user. Please reload.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setConcurrencyError(false);
                    onClose();
                  }}
                  sx={{
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    textTransform: "none",
                  }}
                >
                  Close
                </Button>
              </Box>
            )}

            {/* Mobile Save Button */}
            {isMobile && (
              <Box
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  gap: 1,
                  pt: 1,
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isFormValid}
                  sx={{
                    bgcolor: "black",
                    "&:hover": { bgcolor: "#333" },
                    "&:disabled": { bgcolor: "#e0e0e0", color: "#9e9e9e" },
                  }}
                >
                  {saving ? <CircularProgress size={20} /> : "Save"}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </FormErrorBoundary>
  );
};

export default InvoiceEditor;
