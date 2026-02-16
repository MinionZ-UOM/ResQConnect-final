import type { ChatMessageResponse } from '@/lib/types/chat';

export const mapChatMessage = (data: ChatMessageResponse) => ({
  id: data.id,
  disasterId: data.disaster_id,
  senderId: data.sender_id,
  senderName: data.sender_name,
  text: data.text,
  createdAt: new Date(data.created_at),
});
