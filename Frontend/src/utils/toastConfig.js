import { toast } from 'sonner';

export { toast };

export const toastSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3500,
    ...options,
  });
};

export const toastError = (message, options = {}) => {
  return toast.error(message, {
    duration: 4000,
    ...options,
  });
};

export const toastInfo = (message, options = {}) => {
  return toast.info(message, {
    duration: 3500,
    ...options,
  });
};

export const toastWarning = (message, options = {}) => {
  return toast.warning(message, {
    duration: 3500,
    ...options,
  });
};

export default toast;
