"use client";

import { Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[101] space-y-2">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant ?? "default"}
          onOpenChange={(open) => !open && dismiss(t.id)}
        >
          {t.title && <ToastTitle>{t.title}</ToastTitle>}
          {t.description && <ToastDescription>{t.description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
    </div>
  );
}