// components/ui/use-toast.ts
"use client";

import * as React from "react";

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
  variant?: "default" | "destructive";
};

type ToastListener = (t: ToastInput & { id: string }) => void;

let listeners: ToastListener[] = [];
let counter = 0;

export function toast(t: ToastInput) {
  const id = (counter++).toString();
  listeners.forEach((l) => l({ ...t, id }));
  return id;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<(ToastInput & { id: string })[]>([]);

  React.useEffect(() => {
    const listener: ToastListener = (t) => setToasts((prev) => [t, ...prev].slice(0, 3));
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = (id?: string) =>
    setToasts((prev) => (id ? prev.filter((t) => t.id !== id) : prev.slice(1)));

  return { toast, toasts, dismiss };
}