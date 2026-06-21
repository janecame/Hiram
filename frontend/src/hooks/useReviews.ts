import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createReview, getReviewsByItem } from "../api/reviews";
import type { NewReviewInput } from "../types/review";

export function useReviews(itemId: string) {
  return useQuery({
    queryKey: ["reviews", itemId],
    queryFn: () => getReviewsByItem(itemId),
    enabled: Boolean(itemId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId: _itemId, ...input }: NewReviewInput & { itemId: string }) =>
      createReview(input),
    onSuccess: (_review, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", itemId] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
