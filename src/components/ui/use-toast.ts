import { useState } from "react";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (data: ToastProps) => {
    console.log("Toast:", data); // simple debug
    setToasts((prev) => [...prev, data]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  return { toast, toasts };
}

// optional export
export const toast = (data: ToastProps) => {
  console.log("Toast:", data);
};
