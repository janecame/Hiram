import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmCashPayment, createCashPayment, createCheckout, getPaymentStatus } from "../api/payments";

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

export function useCreateCashPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => createCashPayment(requestId),
    onSuccess: (_payment, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["payment", requestId] });
    },
  });
}

export function useConfirmCashPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => confirmCashPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
    },
  });
}
