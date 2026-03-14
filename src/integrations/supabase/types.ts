export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contest_settings: {
        Row: {
          contest_name: string
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          contest_name?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          contest_name?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_settings_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
        ]
      }
      contestants: {
        Row: {
          biography: string | null
          cover_image: string
          created_at: string
          design_description: string | null
          design_title: string
          id: string
          is_active: boolean
          name: string
          profile_image: string | null
          slug: string | null
          total_votes: number
          updated_at: string
        }
        Insert: {
          biography?: string | null
          cover_image: string
          created_at?: string
          design_description?: string | null
          design_title: string
          id?: string
          is_active?: boolean
          name: string
          profile_image?: string | null
          slug?: string | null
          total_votes?: number
          updated_at?: string
        }
        Update: {
          biography?: string | null
          cover_image?: string
          created_at?: string
          design_description?: string | null
          design_title?: string
          id?: string
          is_active?: boolean
          name?: string
          profile_image?: string | null
          slug?: string | null
          total_votes?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_contestants: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          profile_image: string | null
          slug: string | null
          total_votes: number
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          profile_image?: string | null
          slug?: string | null
          total_votes?: number
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          profile_image?: string | null
          slug?: string | null
          total_votes?: number
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_contestants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_monetary_votes: {
        Row: {
          contestant_id: string
          created_at: string
          event_id: string
          id: string
          payment_id: string
          votes_added: number
        }
        Insert: {
          contestant_id: string
          created_at?: string
          event_id: string
          id?: string
          payment_id: string
          votes_added: number
        }
        Update: {
          contestant_id?: string
          created_at?: string
          event_id?: string
          id?: string
          payment_id?: string
          votes_added?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_monetary_votes_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "event_contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_monetary_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_monetary_votes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "event_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount: number
          contestant_id: string
          created_at: string
          device_metadata: Json | null
          email: string
          event_id: string
          id: string
          ip_address: string | null
          payment_status: string
          transaction_reference: string
          verified_at: string | null
          voter_name: string | null
          votes_purchased: number
        }
        Insert: {
          amount: number
          contestant_id: string
          created_at?: string
          device_metadata?: Json | null
          email: string
          event_id: string
          id?: string
          ip_address?: string | null
          payment_status?: string
          transaction_reference: string
          verified_at?: string | null
          voter_name?: string | null
          votes_purchased: number
        }
        Update: {
          amount?: number
          contestant_id?: string
          created_at?: string
          device_metadata?: Json | null
          email?: string
          event_id?: string
          id?: string
          ip_address?: string | null
          payment_status?: string
          transaction_reference?: string
          verified_at?: string | null
          voter_name?: string | null
          votes_purchased?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "event_contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_votes: {
        Row: {
          contestant_id: string
          created_at: string
          event_id: string
          id: string
          student_id: string
        }
        Insert: {
          contestant_id: string
          created_at?: string
          event_id: string
          id?: string
          student_id: string
        }
        Update: {
          contestant_id?: string
          created_at?: string
          event_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_votes_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "event_contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_votes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image: string | null
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          min_vote_amount: number
          payment_currency: string
          paystack_public_key: string | null
          paystack_secret_key: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          vote_conversion_rate: number
          vote_rule: Database["public"]["Enums"]["event_vote_rule"]
          voting_type: Database["public"]["Enums"]["event_voting_type"]
        }
        Insert: {
          banner_image?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          min_vote_amount?: number
          payment_currency?: string
          paystack_public_key?: string | null
          paystack_secret_key?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          vote_conversion_rate?: number
          vote_rule?: Database["public"]["Enums"]["event_vote_rule"]
          voting_type?: Database["public"]["Enums"]["event_voting_type"]
        }
        Update: {
          banner_image?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          min_vote_amount?: number
          payment_currency?: string
          paystack_public_key?: string | null
          paystack_secret_key?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          vote_conversion_rate?: number
          vote_rule?: Database["public"]["Enums"]["event_vote_rule"]
          voting_type?: Database["public"]["Enums"]["event_voting_type"]
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          contestant_id: string
          created_at: string
          device_metadata: Json | null
          email: string
          id: string
          ip_address: string | null
          payment_status: string
          transaction_reference: string
          verified_at: string | null
          voter_name: string | null
          votes_purchased: number
        }
        Insert: {
          amount: number
          contestant_id: string
          created_at?: string
          device_metadata?: Json | null
          email: string
          id?: string
          ip_address?: string | null
          payment_status?: string
          transaction_reference: string
          verified_at?: string | null
          voter_name?: string | null
          votes_purchased: number
        }
        Update: {
          amount?: number
          contestant_id?: string
          created_at?: string
          device_metadata?: Json | null
          email?: string
          id?: string
          ip_address?: string | null
          payment_status?: string
          transaction_reference?: string
          verified_at?: string | null
          voter_name?: string | null
          votes_purchased?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          matric_number: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          matric_number: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          matric_number?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          contestant_id: string
          created_at: string
          id: string
          payment_id: string
          votes_added: number
        }
        Insert: {
          contestant_id: string
          created_at?: string
          id?: string
          payment_id: string
          votes_added: number
        }
        Update: {
          contestant_id?: string
          created_at?: string
          id?: string
          payment_id?: string
          votes_added?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_event_votes: {
        Args: { p_contestant_id: string; p_vote_count: number }
        Returns: undefined
      }
      increment_votes: {
        Args: { p_contestant_id: string; p_vote_count: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      event_status: "draft" | "live" | "ended"
      event_vote_rule: "per_contestant" | "per_event"
      event_voting_type: "monetary" | "free"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      event_status: ["draft", "live", "ended"],
      event_vote_rule: ["per_contestant", "per_event"],
      event_voting_type: ["monetary", "free"],
    },
  },
} as const
