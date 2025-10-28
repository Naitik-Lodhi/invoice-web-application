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
import SaveIcon from "@mui/icons-material/Save";
import { useForm } from "react-hook-form";
import InvoiceDetailsSection from "./InvoiceDetailsSection";
import LineItemsGrid from "./LineItemsGrid";
import TotalsPanel from "./TotalsPanel";
import { invoiceService } from "../../services/invoiceService";
import { itemService } from "../../services/itemService";
import { toast } from "../../utils/toast";
import dayjs from "dayjs";

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
  notes: string;
  lineItems: LineItem[];
  subTotal: number;
  taxPercent: number;
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
  updatedOnPrev: string | null;
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
    updatedOn: undefined,
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

  // Load available items - USE FULL LIST
useEffect(() => {
  const fetchItems = async () => {
    try {
      // ✅ Use getList() instead of getLookupList() to get full item details
      const items = await itemService.getList();
      console.log("📦 Full items from backend:", items);
      
      const transformed = items.map((item) => ({
        id: String(item.itemID),
        name: item.itemName,
        description: item.description || "",
        rate: item.salesRate || 0,  // ✅ Now this should have value
        discountPct: item.discountPct || 0,  // ✅ Now this should have value
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

      // ✅ FIX: Date handling - preserve original date without timezone shift
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
        updatedOn: response.updatedOn || undefined,
      });

      setLineItems(items);
      setHasChanges(false); // Reset changes flag after loading
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
          id: String(Date.now()), // ✅ Unique ID
          itemId: "",
          itemName: "",
          description: "",
          quantity: 1, // ✅ Default quantity 1
          rate: 0,
          discountPct: 0,
          amount: 0,
        },
      ]);
      setValue("invoiceNo", String(nextInvoiceNumber));
      setHasChanges(false);
    }
  }, [open, mode, nextInvoiceNumber, reset, setValue]);

  // Watch required fields
  const customerName = watch("customerName");
  const invoiceNo = watch("invoiceNo");
  const invoiceDate = watch("invoiceDate");
  const taxPercent = watch("taxPercent") || 0;
  const taxAmount = watch("taxAmount") || 0;
  const currentUpdatedOn = watch("updatedOn");

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
      // ✅ FIX: Ensure date is in YYYY-MM-DD format without timezone shift
      const formattedDate = dayjs(data.invoiceDate).format("YYYY-MM-DD");

      const payload = {
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
        updatedOnPrev: currentUpdatedOn || null,
      };

      await onSave(payload);

      reset(getDefaultValues());
      setLineItems([]);
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
      if (error.response?.status === 409 || error.response?.status === 412) {
        setConcurrencyError(true);
        toast.error("This record was modified by someone else. Please reload.");
        getInvoiceById();
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
    <Dialog open={open} onClose={handleClose} maxWidth={"lg"}>
      <AppBar
        sx={{
          position: "relative",
          backgroundColor: "white",
          color: "black",
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
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
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit(onSubmit)}
                disabled={!isFormValid}
                sx={{
                  bgcolor: "black",
                  "&:hover": { bgcolor: "#333" },
                  "&:disabled": { bgcolor: "#e0e0e0", color: "#9e9e9e" },
                }}
              >
                Save
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <DialogContent
        sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: "#fafafa" }}
      >
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <InvoiceDetailsSection
            control={control}
            errors={errors}
            isMobile={isMobile}
          />

          <Box sx={{ mt: 4 }}>
            <LineItemsGrid
              lineItems={lineItems}
              setLineItems={setLineItems}
              companyCurrency={companyCurrency}
              isMobile={isMobile}
              availableItems={availableItems}
            />
          </Box>

          <Box sx={{ mt: 4 }}>
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

          {/* Validation Summary */}
          {!isFormValid && (customerName || touchedFields.customerName) && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "#fff3cd",
                borderRadius: 1,
                border: "1px solid #ffc107",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#856404", mb: 1 }}
              >
                Please complete the following:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, color: "#856404" }}>
                {!invoiceNo && (
                  <Typography component="li" variant="body2">
                    Invoice number is required
                  </Typography>
                )}
                {!invoiceDate && (
                  <Typography component="li" variant="body2">
                    Invoice date is required
                  </Typography>
                )}
                {(!customerName || customerName.trim().length === 0) && (
                  <Typography component="li" variant="body2">
                    Customer name is required
                  </Typography>
                )}
                {!hasValidLineItems && (
                  <Typography component="li" variant="body2">
                    At least one line item with quantity &gt; 0 is required
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Concurrency Error Alert */}
          {concurrencyError && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "#fee2e2",
                borderRadius: 1,
                border: "1px solid #ef4444",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#991b1b", mb: 1 }}
              >
                ⚠️ Concurrency Conflict
              </Typography>
              <Typography variant="body2" sx={{ color: "#991b1b", mb: 2 }}>
                This invoice was modified by another user. Please reload to see
                the latest changes.
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
                  "&:hover": { borderColor: "#dc2626" },
                }}
              >
                Close and Reload
              </Button>
            </Box>
          )}

          {/* Mobile Save Button */}
          {isMobile && (
            <Box
              sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1 }}
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
                  py: 1.5,
                }}
              >
                Save
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClose}
                disabled={saving}
                sx={{ py: 1.5 }}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceEditor;
