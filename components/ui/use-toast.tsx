// This is a simplified version of the toast component
// In a real application, you would use the full shadcn/ui toast component

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const toast = ({ title, description, variant = "default" }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
    })
  }

  return sonnerToast.success(title, {
    description,
  })
}
