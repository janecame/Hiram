import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserByName, submitIdImage, updateCurrentUser } from "../api/users";
import { uploadImage } from "../api/upload";
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

/** Uploads a government-ID image to S3, then records the submission (→ pending review). */
export function useSubmitId() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const imageUrl = await uploadImage(file, "ids");
      return submitIdImage(imageUrl);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
