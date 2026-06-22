import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserByName, updateCurrentUser } from "../api/users";
import type { User } from "../types/user";

export function useUserByName(name: string | undefined) {
  return useQuery({
    queryKey: ["user", name],
    queryFn: () => getUserByName(name as string),
    enabled: Boolean(name),
  });
}

export function useUpdateUser(_currentName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<User, "name" | "email" | "phone" | "address" | "accountType">>) =>
      updateCurrentUser(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
