import { useMutation, useQuery } from "@tanstack/react-query";
import { createCheckout, getPaymentStatus } from "../api/payments";

export function usePaymentStatus(requestId: string | undefined) {
  return useQuery({
    queryKey: ["payment", requestId],
    queryFn: () => getPaymentStatus(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (requestId: string) => createCheckout(requestId),
    onSuccess: (payment) => {
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      }
    },
  });
}
