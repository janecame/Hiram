import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createItem,
  listItems,
  type ListItemsFilters,
} from "../api/items";
import type { NewItemInput } from "../types/item";

export function useItems(filters: ListItemsFilters) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: () => listItems(filters),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewItemInput) => createItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
