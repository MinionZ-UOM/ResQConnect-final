export interface ChatMessageResponse {
    id: string;
    disaster_id: string;
    sender_id: string;
    sender_name: string;
    text: string;
    created_at: string;
  }
  
  export interface ChatMessageCreate {
    text: string;
  }
  
  export interface ChatApiResponse extends ChatMessageResponse {}
  