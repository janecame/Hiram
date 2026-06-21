import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createRequest,
  getBlockedDates,
  listRequests,
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
