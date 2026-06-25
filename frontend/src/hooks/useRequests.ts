import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  counterOfferRequest,
  createRequest,
  getBlockedDates,
  listRequests,
  respondToCounterOffer,
  updateRequestStatus,
} from "../api/requests";
import type { NewRequestInput, RequestStatus } from "../types/request";

export function useRequests(role: "lister" | "borrower") {
  return useQuery({
    queryKey: ["requests", role],
    queryFn: () => listRequests(role),
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRequestInput) => createRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useBlockedDates(itemId: string | undefined) {
  return useQuery({
    queryKey: ["blocked-dates", itemId],
    queryFn: () => getBlockedDates(itemId as string),
    enabled: Boolean(itemId),
  });
}

export function useCounterOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      proposedStartDate,
      proposedEndDate,
    }: {
      id: string;
      proposedStartDate: string;
      proposedEndDate: string;
    }) => counterOfferRequest(id, proposedStartDate, proposedEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useRespondToCounter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "decline" }) =>
      respondToCounterOffer(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
