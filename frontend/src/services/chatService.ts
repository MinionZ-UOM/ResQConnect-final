import { apiGet, apiPost } from '@/lib/http';
import type { ChatMessageResponse, ChatMessageCreate } from '@/lib/types/chat';
import { mapChatMessage } from '@/lib/utils/mapChatMessage';

// Get recent messages for a disaster
export const getChatMessages = async (
  disasterId: string,
  limit: number = 50
) => {
  const response = await apiGet<ChatMessageResponse[]>(
    `/disasters/${disasterId}/chat/messages?limit=${limit}`
  );
  return response.map(mapChatMessage);
};

// Send a new message
export const sendChatMessage = async (
  disasterId: string,
  message: ChatMessageCreate
) => {
  const response = await apiPost<ChatMessageResponse>(
    `/disasters/${disasterId}/chat/messages`,
    message
  );
  return mapChatMessage(response);
};
