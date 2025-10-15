// src/components/common/PasswordField.tsx
import { useState, useEffect } from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { passwordStrength } from "check-password-strength";

// Define the structure for password strength state
interface PasswordStrength {
  id: number;
  value: string;
  contains: string[];
  length: number;
}

// Same props as FormField, but tailored for password
interface PasswordFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  showStrengthMeter?: boolean;
  maxLength?: number;
}

const strengthColors = ["error", "warning", "info", "success"];

// Validation criteria checklist
const criteria = [
  { id: "length", text: "At least 8 characters long" },
  { id: "number", text: "Contains a number" },
  { id: "lowercase", text: "Contains a lowercase letter" },
  { id: "uppercase", text: "Contains an uppercase letter" },
  { id: "symbol", text: "Contains a special character" }, // Can be added if needed
];

const PasswordField = <T extends FieldValues>({
  name,
  control,
  label,
  showStrengthMeter = false,
  maxLength,
  ...props
}: PasswordFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        useEffect(() => {
          if (showStrengthMeter && field.value) {
            const newStrength = passwordStrength(field.value);
            setStrength(newStrength);
          } else {
            setStrength(null);
          }
        }, [field.value, showStrengthMeter]);

        const progress = strength ? ((strength.id + 1) / 4) * 100 : 0;
        const color = strength ? strengthColors[strength.id] : "inherit";
        return (
          <Box sx={{ width: "100%", mb: 2.5 }}>
            <Typography
              component="label"
              htmlFor={name}
              sx={{ display: "block", mb: 1, fontWeight: "500" }}
            >
              {label}
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            </Typography>
            <TextField
              {...field}
              {...props}
              id={name}
              fullWidth
              required
              type={showPassword ? "text" : "password"}
              onChange={(e) => {
                if (maxLength && e.target.value.length > maxLength) {
                  e.target.value = e.target.value.slice(0, maxLength);
                }
                field.onChange(e); // Update react-hook-form
              }}
              error={!!error}
              helperText={error ? error.message : null}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                  "& input": { height: "42px", padding: "0 14px" },
                },
              }}
            />

            {showStrengthMeter && field.value && strength && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: "6px", borderRadius: "3px" }}
                />
                <Typography
                  variant="caption"
                  color={color === "error" ? "error.main" : "text.secondary"}
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Strength: {strength.value}
                </Typography>
                <List dense sx={{ p: 0, mt: 1 }}>
                  {criteria.map((item) => {
                    let isMet = false;
                    if (item.id === "length") {
                      // Handle length check separately
                      isMet = strength.length >= 8;
                    } else {
                      // Handle other criteria as before
                      isMet = strength.contains.includes(item.id);
                    }
                    return (
                      <ListItem
                        key={item.id}
                        sx={{
                          p: 0,
                          color: isMet ? "success.main" : "text.secondary",
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {isMet ? (
                            <CheckCircle fontSize="small" color="success" />
                          ) : (
                            <Cancel fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="caption">
                              {item.text}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Box>
        );
      }}
    />
  );
};

export default PasswordField;
