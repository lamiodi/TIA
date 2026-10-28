import React from 'react';
import { toast as sonnerToast } from 'sonner';

export const toast = Object.assign(
  (msg, opts) => sonnerToast(msg, typeof opts === 'object' ? opts : undefined),
  {
    success: (msg, opts) => sonnerToast.success(msg, typeof opts === 'object' ? opts : undefined),
    error: (msg, opts) => sonnerToast.error(msg, typeof opts === 'object' ? opts : undefined),
    info: (msg, opts) => sonnerToast.info(msg, typeof opts === 'object' ? opts : undefined),
    warn: (msg, opts) => sonnerToast.warning(msg, typeof opts === 'object' ? opts : undefined),
    warning: (msg, opts) => sonnerToast.warning(msg, typeof opts === 'object' ? opts : undefined),
    dismiss: (id) => sonnerToast.dismiss(id),
  }
);

export const ToastContainer = () => null;
export default toast;
