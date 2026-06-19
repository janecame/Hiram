import { useQuery } from "@tanstack/react-query";
import { getUserByName } from "../api/users";

export function useUserByName(name: string | undefined) {
  return useQuery({
    queryKey: ["user", name],
    queryFn: () => getUserByName(name as string),
    enabled: Boolean(name),
  });
}
