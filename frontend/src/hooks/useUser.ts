import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptTerms, getCurrentUser, getUserByName, searchUsers, submitIdImage, updateAvatar, updateCurrentUser } from "../api/users";
import { uploadImage } from "../api/upload";
import type { User } from "../types/user";

export function useUserByName(name: string | undefined) {
  return useQuery({
    queryKey: ["user", name],
    queryFn: () => getUserByName(name as string),
    enabled: Boolean(name),
  });
}

/** The currently authenticated user (includes termsAcceptedAt). Pass `enabled` to gate the fetch. */
export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled,
    staleTime: 60_000,
  });
}

/** Records Terms and Conditions acceptance for the logged-in user. */
export function useAcceptTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => acceptTerms(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ["users", "search", q],
    queryFn: () => searchUsers(q),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });
}

export function useUpdateUser(_currentName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<User,
      | "name" | "email" | "phone" | "address" | "accountType"
      | "defaultProvince" | "defaultCity" | "defaultBarangay"
      | "defaultAddressDetail" | "defaultMeetup"
    >>) => updateCurrentUser(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

/** Uploads a profile avatar to S3, then records the URL on the user. */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const avatarUrl = await uploadImage(file, "avatars");
      return updateAvatar(avatarUrl);
    },
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
