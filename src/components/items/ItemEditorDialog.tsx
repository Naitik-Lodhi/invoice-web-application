// src/components/items/ItemEditorDialog.tsx
import { useEffect, useState } from "react";
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
  Grid,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { useForm } from "react-hook-form";
import type { ItemEditorProps, ItemFormData } from "../../types/itemTypes";
import FileUploadField from "../form/FileUploadField";
import FormField from "../form/FormField";
import { itemService } from "../../services/itemService";
import { toast } from "../../utils/toast";
import { FormErrorBoundary } from "../../error/ErrorBoundary";

const ItemEditorDialog = ({
  open,
  mode,
  itemData,
  onClose,
  onSave,
}: ItemEditorProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [concurrencyError, setConcurrencyError] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  } = useForm<ItemFormData>({
    mode: "onChange",
    defaultValues: {
      itemPicture: null,
      itemName: "",
      description: "",
      saleRate: 0,
      discountPct: 0,
    },
  });

  // Load data when dialog opens
  useEffect(() => {
    if (open && mode === "edit" && itemData) {
      setIsLoadingData(true);
      setDataLoaded(false);
      setImageRemoved(false);

      const loadData = async () => {
        try {
          try {
            const imageUrl = await itemService.getPictureThumbnail(
              itemData.itemID
            );
            setExistingImageUrl(imageUrl);
          } catch (error) {
            setExistingImageUrl(null);
          }

          reset({
            itemPicture: null,
            itemName: itemData.itemName,
            description: itemData.description || "",
            saleRate: itemData.salesRate || 0,
            discountPct: itemData.discountPct || 0,
            updatedOn: itemData.updatedOn,
          });

          setDataLoaded(true);
        } finally {
          setIsLoadingData(false);
        }
      };

      loadData();
    } else if (open && mode === "new") {
      setExistingImageUrl(null);
      setDataLoaded(true);
      setImageRemoved(false);
      reset({
        itemPicture: null,
        itemName: "",
        description: "",
        saleRate: 0,
        discountPct: 0,
      });
    }
  }, [open, mode, itemData, reset]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setDataLoaded(false);
      setIsLoadingData(false);
      setConcurrencyError(false);
      setSaveError(null);
      setImageRemoved(false);
    }
  }, [open]);

  // ✅ FIXED: Simpler validation
  const isFormValid = dataLoaded && isValid && !isSubmitting;

  const onSubmit = async (data: ItemFormData) => {
    console.log("📝 Form data before submit:", data);
    console.log("📝 Item picture:", data.itemPicture);
    console.log("📝 Is File?", data.itemPicture instanceof File);

    // ✅ VALIDATE before calling onSave
    if (!data.itemName || data.itemName.trim() === "") {
      toast.error("Item name is required");
      return;
    }

    if (
      data.saleRate === undefined ||
      data.saleRate === null ||
      isNaN(Number(data.saleRate))
    ) {
      toast.error("Valid sale rate is required");
      return;
    }

    setConcurrencyError(false);
    setSaveError(null);

    try {
      await onSave({
        ...data,
        updatedOn: itemData?.updatedOn || null,
        imageRemoved,
      });
      // ✅ handleClose will be called by parent after successful save
    } catch (error: any) {
      console.error("❌ Save error in dialog:", error);

      if (error.message?.includes("modified by another user")) {
        setConcurrencyError(true);
      } else if (error.message?.includes("already exists")) {
        setSaveError(error.message);
      } else if (error.message?.includes("Image upload failed")) {
        // ✅ Don't show error in dialog, parent already showed toast
        handleClose();
      } else {
        setSaveError(error.message || "Failed to save item");
      }
    }
  };
  const handleClose = () => {
    reset();
    setExistingImageUrl(null);
    setConcurrencyError(false);
    setSaveError(null);
    setDataLoaded(false);
    setImageRemoved(false);
    setErrorKey((prev) => prev + 1);
    onClose();
  };

  const handleImageRemove = () => {
    setImageRemoved(true);
    console.log("🗑️ Image marked for removal");
  };

  return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
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
              {mode === "new" ? "New Item" : "Edit Item"}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
              disabled={isSubmitting}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, backgroundColor: "#fafafa" }}>
          {isLoadingData ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
             <FormErrorBoundary key={errorKey}>
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ maxWidth: 600, mx: "auto" }}
            >
              {/* Picture Upload */}
              <FileUploadField
                name="itemPicture"
                control={control}
                label="Picture"
                existingImageUrl={existingImageUrl}
                onImageRemove={handleImageRemove}
              />

              {/* Item Name */}
              <FormField
                name="itemName"
                control={control}
                label="Item Name"
                type="text"
                placeholder="Enter item name"
                required
                maxLength={50}
                rules={{
                  required: "Item name is required",
                  validate: (value: string) =>
                    value?.trim().length > 0 || "Item name cannot be empty",
                }}
              />

              {/* Description */}
              <FormField
                name="description"
                control={control}
                label="Description"
                placeholder="Enter item description"
                rows={2}
                maxLength={500}
              />

              {/* Sale Rate and Discount */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormField
                    name="saleRate"
                    control={control}
                    label="Sale Rate"
                    type="number"
                    placeholder="0.00"
                    required
                    rules={{
                      required: "Sale rate is required",
                      validate: (value: number) => {
                        const num = Number(value);
                        if (isNaN(num)) return "Please enter a valid number";
                        if (num < 0) return "Sale rate must be greater than 0";
                        return true;
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormField
                    name="discountPct"
                    control={control}
                    label="Discount %"
                    type="number"
                    placeholder="0.00"
                    rules={{
                      min: {
                        value: 0,
                        message: "Discount must be 0 or greater",
                      },
                      max: {
                        value: 100,
                        message: "Discount cannot exceed 100%",
                      },
                      validate: (value: any) => {
                        const num = Number(value);
                        if (isNaN(num)) return "Please enter a valid number";
                        if (num < 0) return "Discount must be 0 or greater";
                        if (num > 100) return "Discount cannot exceed 100%";
                        return true;
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Duplicate Name Error Alert */}
              {saveError && !concurrencyError && (
                <Box
                  sx={{
                    mt: 2,
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
                    ⚠️ Error
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#991b1b" }}>
                    {saveError}
                  </Typography>
                </Box>
              )}

              {/* Concurrency Error Alert */}
              {concurrencyError && (
                <Box
                  sx={{
                    mt: 2,
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
                    This item was modified by another user. Please reload and
                    try again.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClose}
                    sx={{
                      borderColor: "#ef4444",
                      color: "#ef4444",
                      "&:hover": {
                        borderColor: "#dc2626",
                        bgcolor: "rgba(239, 68, 68, 0.04)",
                      },
                      textTransform: "none",
                    }}
                  >
                    Close
                  </Button>
                </Box>
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  flexDirection: isMobile ? "column-reverse" : "row",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  fullWidth={isMobile}
                  sx={{ textTransform: "none" }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isFormValid}
                  startIcon={
                    isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                  fullWidth={isMobile}
                  sx={{
                    bgcolor: "black",
                    "&:hover": { bgcolor: "#333" },
                    "&:disabled": {
                      bgcolor: "#e0e0e0",
                      color: "#9e9e9e",
                    },
                    textTransform: "none",
                    py: 1.5,
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Box>
            </FormErrorBoundary>
          )}
        </DialogContent>
      </Dialog>
  );
};

export default ItemEditorDialog;
