import React from "react";
import { Toaster as Sonner, toast } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group font-Jost"
      position="top-right"
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1E1E1E] group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:font-Jost",
          title: "group-[.toast]:text-white group-[.toast]:font-Manrope group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-gray-300 group-[.toast]:text-xs group-[.toast]:font-Jost group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-[#1E1E1E] group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs",
          success: "group-[.toaster]:border-emerald-500/30",
          error: "group-[.toaster]:border-rose-500/30",
          info: "group-[.toaster]:border-blue-500/30",
          warning: "group-[.toaster]:border-amber-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
