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
  setItemArchived,
  deleteItem,
  getItemSuggestions,
  type ListItemsFilters,
  type PaginatedItems,
} from "../api/items";

export type { PaginatedItems };
import type { NewItemInput } from "../types/item";

// Single retry only so a real failure surfaces as an error state instead of
// keeping the page in a loading skeleton through the full backoff sequence.
export function useItems(filters: ListItemsFilters) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: () => listItems(filters),
    retry: 1,
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

export function useArchivedItemsByOwner(owner: string | undefined) {
  return useQuery({
    queryKey: ["items", "by-owner-archived", owner],
    queryFn: () => getItemsByOwner(owner as string, { archived: true }),
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

export function useSetItemArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      setItemArchived(id, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useItemSuggestions(query: string) {
  return useQuery({
    queryKey: ["items", "suggestions", query],
    queryFn: () => getItemSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
