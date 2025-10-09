// src/components/common/FileUploadField.tsx
import { useState } from "react";
import { Box, Button, Typography, Avatar } from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";

interface FileUploadFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
}

const FileUploadField = <T extends FieldValues>({
  name,
  control,
  label,
}: FileUploadFieldProps<T>) => {
  // State for image preview URL and file name
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>("No file chosen");

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <Box sx={{ mb: 2.5, width: "100%" }}>
          {/* Label outside the box */}
          <Typography
            component="label"
            sx={{ display: "block", mb: 1, fontWeight: "500" }}
          >
            {label}
          </Typography>

          {/* Main container with dashed border */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              border: `1px  ${error ? "red" : "grey"}`,
              borderRadius: "8px",
            }}
          >
            {/* Left Side: Image Preview / Fallback Icon */}
            <Avatar
              src={preview || undefined}
              variant="rounded"
              sx={{
                width: 80,
                height: 80,
                bgcolor: "#f0f0f0",
                color: "text.secondary",
              }}
            >
              {!preview && (
                <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 40 }} />
              )}
            </Avatar>

            {/* Right Side: Content and Upload Button */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                //   justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2,
                  gap: 2,
                  border: `2px dashed ${error ? "red" : "#ccc"}`,
                  p: 2,
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ mb: 1, alignSelf: "flex-start" }} // Button ko left mein rakhega
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept="image/png, image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file); // Update react-hook-form state
                        setPreview(URL.createObjectURL(file)); // Create preview
                        setFileName(file.name); // Show file name
                      } else {
                        onChange(null); // Handle case where user cancels file selection
                        setPreview(null);
                        setFileName("No file chosen");
                      }
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {fileName}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Max file size: 5MB
              </Typography>
            </Box>
          </Box>

          {/* Error message below the box */}
          {error && (
            <Typography
              color="error"
              variant="caption"
              sx={{ display: "block", mt: 1, ml: 1 }}
            >
              {error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
};

export default FileUploadField;
