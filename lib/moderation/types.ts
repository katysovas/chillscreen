export type ModerationBlockKind = 'user_id' | 'display_name' | 'ip';

export type ModerationBlock = {
  id: number;
  kind: ModerationBlockKind;
  value: string;
  note: string | null;
  created_at: string;
};

export type ChatAccountRow = {
  user_id: string;
  festie_name: string | null;
  stage_slug: string | null;
  created_at: string;
  conversation_sessions: number;
  last_chat_at: string | null;
  blocked: boolean;
};

export type AnonymousChatterRow = {
  sender: string;
  display_name: string;
  user_id: string | null;
  message_count: number;
  last_ts: number;
  rooms: string[];
};
