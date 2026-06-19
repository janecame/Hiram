import { useQuery } from "@tanstack/react-query";
import { getItem } from "../api/items";

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => getItem(id as string),
    enabled: Boolean(id),
  });
}
