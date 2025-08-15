import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export const toastSuccess = (message) => {
  toast.success(message, {
    position: 'top-center',
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'custom-toast custom-toast-success',
    bodyClassName: 'text-sm font-medium text-Secondarycolor',
    icon: '🛒',
    role: 'alert', // Accessibility
    'aria-live': 'assertive',
  });
};

export const toastError = (message) => {
  toast.error(message, {
    position: 'top-center',
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'custom-toast custom-toast-error',
    bodyClassName: 'text-sm font-medium text-white',
    icon: '❌',
    role: 'alert',
    'aria-live': 'assertive',
  });
};