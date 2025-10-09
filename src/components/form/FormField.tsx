// src/components/common/FormField.tsx
import { TextField, Typography, Box } from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

// Using generics for better type safety with react-hook-form
interface FormFieldProps<T extends FieldValues> {
  name: Path<T>; // Ensures name is a valid key of our form values
  control: Control<T>;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}

const FormField = <T extends FieldValues>({
  name,
  control,
  label,
  type = "text",
  required = false,
  rows = 1,
  maxLength,
  ...props
}: FormFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box sx={{ width: "100%", mb: 2.5 }}>
          {" "}
          {/* Added more margin-bottom */}
          <Typography
            component="label"
            htmlFor={name}
            sx={{ display: "block", mb: 1, fontWeight: "500" }}
          >
            {label}
            {required && (
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            )}
          </Typography>
          <TextField
            {...field}
            {...props}
            id={name}
            fullWidth
            type={type}
            multiline={rows > 1}
            rows={rows}
            // --- ZIP CODE FIX ---
            onChange={(e) => {
              if (maxLength && e.target.value.length > maxLength) {
                e.target.value = e.target.value.slice(0, maxLength);
              }
              field.onChange(e); // Propagate the change to react-hook-form
            }}
            error={!!error}
            helperText={error ? error.message : null}
            variant="outlined"
            // Apply custom styles here
            sx={{
              // For Webkit browsers (Chrome, Safari, Edge)
              "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                {
                  "-webkit-appearance": "none",
                  margin: 0,
                },
              // For Firefox
              "& input[type=number]": {
                "-moz-appearance": "textfield",
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
        </Box>
      )}
    />
  );
};

export default FormField;
