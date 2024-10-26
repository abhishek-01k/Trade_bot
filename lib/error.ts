import { Toast } from "@/components/ui/toast";

export const ErrorToast = (title: string) => {
  Toast({
    variant: "destructive",
    title,
  });
};
