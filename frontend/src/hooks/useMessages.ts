import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createConversation,
  getConversations,
  getMessages,
  getUnreadMessageCount,
  sendMessage,
} from '../api/messages';
import { useAuth } from '../auth/AuthContext';

export function useConversations() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: isAuthenticated,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useUnreadMessageCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['conversations', 'unread'],
    queryFn: getUnreadMessageCount,
    enabled: isAuthenticated,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, listerId }: { itemId: string; listerId: string }) =>
      createConversation(itemId, listerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: (message) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
