// src/utils/toast.ts
import { enqueueSnackbar, type VariantType, type OptionsObject } from 'notistack';

export const showToast = (
  message: string, 
  variant: VariantType = 'default',
  options?: Partial<OptionsObject>
) => {
  enqueueSnackbar(message, {
    variant,
    autoHideDuration: 3000,
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'right',
    },
    ...options,
  });
};

export const toast = {
  success: (message: string, options?: Partial<OptionsObject>) => 
    showToast(message, 'success', options),
  error: (message: string, options?: Partial<OptionsObject>) => 
    showToast(message, 'error', options),
  warning: (message: string, options?: Partial<OptionsObject>) => 
    showToast(message, 'warning', options),
  info: (message: string, options?: Partial<OptionsObject>) => 
    showToast(message, 'info', options),
};