import { toast } from "@/hooks/use-toast"

export const ErrorToast = (title: string) => {
    toast({
        variant: 'destructive',
        title,
    })
}