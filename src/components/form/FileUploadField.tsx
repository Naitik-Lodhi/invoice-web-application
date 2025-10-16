// src/components/form/FileUploadField.tsx
import { useState, useEffect } from "react";
import { Box, Button, Typography, Avatar, IconButton } from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";

interface FileUploadFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  existingImageUrl?: string | null;
  maxSize?: number;
  accept?: string;
  onImageRemove?: () => void; // ✅ New prop
}

const isFile = (value: any): value is File => {
  return value instanceof File;
};

const FileUploadField = <T extends FieldValues>({
  name,
  control,
  label,
  existingImageUrl,
  maxSize = 5,
  accept = "image/png, image/jpeg",
  onImageRemove, // ✅ New prop
}: FileUploadFieldProps<T>) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isExistingImageRemoved, setIsExistingImageRemoved] = useState(false); // ✅ Track removal

  // Set existing image URL as preview
  useEffect(() => {
    if (existingImageUrl && !isExistingImageRemoved) {
      setPreview(existingImageUrl);
    }
  }, [existingImageUrl, isExistingImageRemoved]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (
    file: File | null,
    onChange: (value: any) => void
  ) => {
    if (file) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Clean up previous object URL
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }

      // Create new preview
      const newPreview = URL.createObjectURL(file);
      setPreview(newPreview);
      setIsExistingImageRemoved(false); // ✅ Reset removal flag
      onChange(file);
    } else {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      setPreview(existingImageUrl && !isExistingImageRemoved ? existingImageUrl : null);
      onChange(null);
    }
  };

  // ✅ NEW: Handle permanent removal
  const handleRemove = (onChange: (value: any) => void) => {
    // Clean up blob URL if exists
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    
    // Clear preview
    setPreview(null);
    
    // Mark existing image as removed
    setIsExistingImageRemoved(true);
    
    // Set form value to special marker for deletion
    onChange("DELETE_IMAGE"); // ✅ Special marker
    
    // Call parent callback if provided
    if (onImageRemove) {
      onImageRemove();
    }

    // Reset file input
    const fileInput = document.getElementById(name) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Box sx={{ mb: 3 }}>
          {/* Label */}
          <Typography
            component="label"
            sx={{
              display: "block",
              mb: 1.5,
              fontWeight: 500,
              fontSize: "0.875rem",
              color: "text.primary",
            }}
          >
            {label}
          </Typography>

          {/* Upload Container */}
          <Box
            sx={{
              border: `2px dashed ${error ? "#ef4444" : "#e0e0e0"}`,
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              backgroundColor: error ? "#fef2f2" : "#fafafa",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: error ? "#ef4444" : "#a0a0a0",
                backgroundColor: error ? "#fef2f2" : "#f5f5f5",
              },
            }}
          >
            {/* Preview Section */}
            {preview && value !== "DELETE_IMAGE" ? (
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={preview}
                  variant="rounded"
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    boxShadow: 2,
                  }}
                />
                {/* Remove button */}
                <IconButton
                  size="small"
                  onClick={() => handleRemove(onChange)}
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "#ef4444",
                    color: "white",
                    boxShadow: 2,
                    "&:hover": {
                      bgcolor: "#dc2626",
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box>
                <AddPhotoAlternateOutlinedIcon
                  sx={{
                    fontSize: 60,
                    color: "text.secondary",
                    mb: 2,
                  }}
                />
              </Box>
            )}

            {/* Upload Button and Info */}
            <Box>
              <Button
                variant="contained"
                component="label"
                size="small"
                sx={{
                  backgroundColor: "#171717",
                  color: "white",
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "#333",
                  },
                }}
              >
                {preview && value !== "DELETE_IMAGE" ? "Change Image" : "Choose Image"}
                <input
                  type="file"
                  hidden
                  id={name}
                  data-testid="file-upload-input"
                  accept={accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleFileChange(file || null, onChange);
                  }}
                />
              </Button>

              {/* File info */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                {isFile(value)
                  ? `Selected: ${value.name}`
                  : value === "DELETE_IMAGE"
                  ? "Image will be removed"
                  : preview && !preview.startsWith("blob:")
                  ? "Current image"
                  : `Max file size: ${maxSize}MB`}
              </Typography>

              {/* Supported formats */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Supported: JPG, PNG
              </Typography>
            </Box>
          </Box>

          {/* Error Message */}
          {error && (
            <Typography
              color="error"
              variant="caption"
              sx={{ display: "block", mt: 1, ml: 0.5 }}
            >
              {error.message || "Please upload an image"}
            </Typography>
          )}
        </Box>
      )}
    />
  );
};

export default FileUploadField;