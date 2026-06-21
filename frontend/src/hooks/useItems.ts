import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createItem,
  updateItem,
  getItemsByOwner,
  listItems,
  type ListItemsFilters,
  type PaginatedItems,
} from "../api/items";

export type { PaginatedItems };
import type { NewItemInput } from "../types/item";

export function useItems(filters: ListItemsFilters) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: () => listItems(filters),
  });
}

// Key stays under the "items" namespace so useCreateItem's
// invalidateQueries({ queryKey: ["items"] }) refreshes profile listings too.
export function useItemsByOwner(owner: string | undefined) {
  return useQuery({
    queryKey: ["items", "by-owner", owner],
    queryFn: () => getItemsByOwner(owner as string),
    enabled: Boolean(owner),
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

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NewItemInput>) => updateItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", id] });
    },
  });
}
