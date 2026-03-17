export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          model: string;
          tools_enabled: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          model?: string;
          tools_enabled?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          model?: string;
          tools_enabled?: string[];
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "tool";
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "tool";
          content: Json;
          created_at?: string;
        };
        Update: {
          content?: Json;
        };
      };
    };
  };
}

export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type DbMessage = Database["public"]["Tables"]["messages"]["Row"];
