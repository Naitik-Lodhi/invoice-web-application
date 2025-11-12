// src/components/common/FormField.tsx
import { TextField, Typography, Box, type TextFieldProps } from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: 'text' | 'email' | 'number' | 'tel';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  rules?: any;
  onBlur?: (value: string) => void | Promise<void>;
  InputProps?: TextFieldProps['InputProps'];
  helperText?: string;
}

const FormField = <T extends FieldValues>({
  name,
  control,
  label,
  type = "text",
  required = false,
  rows = 1,
  maxLength,
  rules,
  onBlur,
  InputProps,
  helperText: customHelperText,
  ...props
}: FormFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <Box sx={{ width: "100%", mb: 1 }}>
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
            InputProps={InputProps}
            onChange={(e) => {
              if (maxLength && e.target.value.length > maxLength) {
                e.target.value = e.target.value.slice(0, maxLength);
              }
              field.onChange(e);
            }}
            onBlur={(e) => {
              field.onBlur();
              if (onBlur) {
                onBlur(e.target.value);
              }
            }}
            error={!!error}
            helperText={customHelperText || (error ? error.message : null)}
            variant="outlined"
            sx={{
              "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                {
                  "WebkitAppearance": "none",
                  margin: 0,
                },
              "& input[type=number]": {
                "MozAppearance": "textfield",
              },
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