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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_status: {
        Row: {
          is_admin: boolean
          status: Database["public"]["Enums"]["user_status"]
          suspended_until: string | null
          updated_at: string
          user_id: string
          warning_count: number
        }
        Insert: {
          is_admin?: boolean
          status?: Database["public"]["Enums"]["user_status"]
          suspended_until?: string | null
          updated_at?: string
          user_id: string
          warning_count?: number
        }
        Update: {
          is_admin?: boolean
          status?: Database["public"]["Enums"]["user_status"]
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          detail: Json
          id: number
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          detail?: Json
          id?: never
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          detail?: Json
          id?: never
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      adoptions: {
        Row: {
          adopter_agreed_pledge: boolean
          adopter_confirmed_at: string | null
          adopter_id: string
          completed_at: string | null
          created_at: string
          id: string
          post_id: string
          rehomer_confirmed_at: string | null
          rehomer_id: string
          room_id: string
        }
        Insert: {
          adopter_agreed_pledge?: boolean
          adopter_confirmed_at?: string | null
          adopter_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          post_id: string
          rehomer_confirmed_at?: string | null
          rehomer_id: string
          room_id: string
        }
        Update: {
          adopter_agreed_pledge?: boolean
          adopter_confirmed_at?: string | null
          adopter_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          post_id?: string
          rehomer_confirmed_at?: string | null
          rehomer_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoptions_adopter_id_fkey"
            columns: ["adopter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoptions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoptions_rehomer_id_fkey"
            columns: ["rehomer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoptions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      banned_identities: {
        Row: {
          ci_hash: string
          created_at: string
          reason: string | null
        }
        Insert: {
          ci_hash: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          ci_hash?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          action: Database["public"]["Enums"]["word_action"]
          created_at: string
          id: number
          is_regex: boolean
          label: string
          pattern: string
          scope: Database["public"]["Enums"]["word_scope"]
        }
        Insert: {
          action: Database["public"]["Enums"]["word_action"]
          created_at?: string
          id?: never
          is_regex?: boolean
          label: string
          pattern: string
          scope?: Database["public"]["Enums"]["word_scope"]
        }
        Update: {
          action?: Database["public"]["Enums"]["word_action"]
          created_at?: string
          id?: never
          is_regex?: boolean
          label?: string
          pattern?: string
          scope?: Database["public"]["Enums"]["word_scope"]
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breeds: {
        Row: {
          category_id: number
          id: number
          is_banned: boolean
          is_cites: boolean
          name: string
          requires_review: boolean
          sort_order: number
        }
        Insert: {
          category_id: number
          id?: never
          is_banned?: boolean
          is_cites?: boolean
          name: string
          requires_review?: boolean
          sort_order?: number
        }
        Update: {
          category_id?: number
          id?: never
          is_banned?: boolean
          is_cites?: boolean
          name?: string
          requires_review?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "breeds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          adopter_id: string
          adopter_last_read_at: string | null
          created_at: string
          first_message_at: string | null
          first_message_notified: boolean
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          payment_id: string | null
          post_id: string
          rehomer_id: string
          rehomer_last_read_at: string | null
        }
        Insert: {
          adopter_id: string
          adopter_last_read_at?: string | null
          created_at?: string
          first_message_at?: string | null
          first_message_notified?: boolean
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          payment_id?: string | null
          post_id: string
          rehomer_id: string
          rehomer_last_read_at?: string | null
        }
        Update: {
          adopter_id?: string
          adopter_last_read_at?: string | null
          created_at?: string
          first_message_at?: string | null
          first_message_notified?: boolean
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          payment_id?: string | null
          post_id?: string
          rehomer_id?: string
          rehomer_last_read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_adopter_id_fkey"
            columns: ["adopter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_rehomer_id_fkey"
            columns: ["rehomer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          agreed_at: string
          id: number
          marketing: boolean
          privacy_version: string
          terms_version: string
          user_id: string
        }
        Insert: {
          agreed_at?: string
          id?: never
          marketing?: boolean
          privacy_version: string
          terms_version: string
          user_id: string
        }
        Update: {
          agreed_at?: string
          id?: never
          marketing?: boolean
          privacy_version?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          birth_year: number
          ci_hash: string
          phone: string
          provider: string
          user_id: string
          verified_at: string
        }
        Insert: {
          birth_year: number
          ci_hash: string
          phone: string
          provider: string
          user_id: string
          verified_at?: string
        }
        Update: {
          birth_year?: number
          ci_hash?: string
          phone?: string
          provider?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          flag_reason: string | null
          id: number
          image_path: string | null
          is_blocked: boolean
          room_id: string
          sender_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          flag_reason?: string | null
          id?: never
          image_path?: string | null
          is_blocked?: boolean
          room_id: string
          sender_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          flag_reason?: string | null
          id?: never
          image_path?: string | null
          is_blocked?: boolean
          room_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: number
          payload: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: never
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: never
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_consents: {
        Row: {
          agreed_auto_billing: boolean
          agreed_free_rehoming: boolean
          agreed_no_refund_after_chat: boolean
          created_at: string
          id: string
          notice_version: string
          payment_id: string | null
          user_id: string
        }
        Insert: {
          agreed_auto_billing: boolean
          agreed_free_rehoming: boolean
          agreed_no_refund_after_chat: boolean
          created_at?: string
          id?: string
          notice_version: string
          payment_id?: string | null
          user_id: string
        }
        Update: {
          agreed_auto_billing?: boolean
          agreed_free_rehoming?: boolean
          agreed_no_refund_after_chat?: boolean
          created_at?: string
          id?: string
          notice_version?: string
          payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_consents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          failure_reason: string | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          pg_payment_id: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          pg_payment_id?: string | null
          refunded_at?: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          pg_payment_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          content_hash: string | null
          created_at: string
          id: string
          is_cover: boolean
          post_id: string
          sort_order: number
          storage_path: string
          type: Database["public"]["Enums"]["media_type"]
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          post_id: string
          sort_order?: number
          storage_path: string
          type: Database["public"]["Enums"]["media_type"]
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          post_id?: string
          sort_order?: number
          storage_path?: string
          type?: Database["public"]["Enums"]["media_type"]
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          adopted_at: string | null
          author_id: string
          birth_date: string
          breed_id: number | null
          breed_text: string | null
          category_id: number
          cites_docs: boolean | null
          created_at: string
          deleted_at: string | null
          description: string
          favorite_count: number
          good_with_animals: Database["public"]["Enums"]["tri_state"]
          good_with_kids: Database["public"]["Enums"]["tri_state"]
          good_with_people: Database["public"]["Enums"]["tri_state"]
          health_note: string | null
          id: string
          included_items: string | null
          is_urgent: boolean
          last_confirmed_at: string
          neutered: Database["public"]["Enums"]["tri_state"]
          potty_trained: Database["public"]["Enums"]["tri_state"]
          reason: string
          region_sido: string
          region_sigungu: string
          registered: Database["public"]["Enums"]["tri_state"]
          registration_no: string | null
          review_note: string | null
          pet_name: string | null
          sex: Database["public"]["Enums"]["pet_sex"]
          size: Database["public"]["Enums"]["pet_size"] | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          urgent_deadline: string | null
          vaccinated: Database["public"]["Enums"]["tri_state"]
          view_count: number
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          adopted_at?: string | null
          author_id: string
          birth_date: string
          breed_id?: number | null
          breed_text?: string | null
          category_id: number
          cites_docs?: boolean | null
          created_at?: string
          deleted_at?: string | null
          description: string
          favorite_count?: number
          good_with_animals?: Database["public"]["Enums"]["tri_state"]
          good_with_kids?: Database["public"]["Enums"]["tri_state"]
          good_with_people?: Database["public"]["Enums"]["tri_state"]
          health_note?: string | null
          id?: string
          included_items?: string | null
          is_urgent?: boolean
          last_confirmed_at?: string
          neutered?: Database["public"]["Enums"]["tri_state"]
          potty_trained?: Database["public"]["Enums"]["tri_state"]
          reason: string
          region_sido: string
          region_sigungu: string
          registered?: Database["public"]["Enums"]["tri_state"]
          registration_no?: string | null
          review_note?: string | null
          pet_name?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          size?: Database["public"]["Enums"]["pet_size"] | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          urgent_deadline?: string | null
          vaccinated?: Database["public"]["Enums"]["tri_state"]
          view_count?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          adopted_at?: string | null
          author_id?: string
          birth_date?: string
          breed_id?: number | null
          breed_text?: string | null
          category_id?: number
          cites_docs?: boolean | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          favorite_count?: number
          good_with_animals?: Database["public"]["Enums"]["tri_state"]
          good_with_kids?: Database["public"]["Enums"]["tri_state"]
          good_with_people?: Database["public"]["Enums"]["tri_state"]
          health_note?: string | null
          id?: string
          included_items?: string | null
          is_urgent?: boolean
          last_confirmed_at?: string
          neutered?: Database["public"]["Enums"]["tri_state"]
          potty_trained?: Database["public"]["Enums"]["tri_state"]
          reason?: string
          region_sido?: string
          region_sigungu?: string
          registered?: Database["public"]["Enums"]["tri_state"]
          registration_no?: string | null
          review_note?: string | null
          pet_name?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          size?: Database["public"]["Enums"]["pet_size"] | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          urgent_deadline?: string | null
          vaccinated?: Database["public"]["Enums"]["tri_state"]
          view_count?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          nickname: string | null
          onboarded_at: string | null
          primary_purpose: Database["public"]["Enums"]["purpose"] | null
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_verified?: boolean
          nickname?: string | null
          onboarded_at?: string | null
          primary_purpose?: Database["public"]["Enums"]["purpose"] | null
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          nickname?: string | null
          onboarded_at?: string | null
          primary_purpose?: Database["public"]["Enums"]["purpose"] | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          created_at: string
          id: string
          note: string | null
          payment_id: string
          processed_at: string | null
          reason: Database["public"]["Enums"]["refund_reason"]
          status: Database["public"]["Enums"]["refund_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          payment_id: string
          processed_at?: string | null
          reason: Database["public"]["Enums"]["refund_reason"]
          status?: Database["public"]["Enums"]["refund_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          payment_id?: string
          processed_at?: string | null
          reason?: Database["public"]["Enums"]["refund_reason"]
          status?: Database["public"]["Enums"]["refund_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_message_id: number | null
          target_post_id: string | null
          target_type: Database["public"]["Enums"]["report_target"]
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_message_id?: number | null
          target_post_id?: string | null
          target_type: Database["public"]["Enums"]["report_target"]
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_message_id?: number | null
          target_post_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target"]
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_message_id_fkey"
            columns: ["target_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          reason: string
          report_id: string | null
          starts_at: string
          type: Database["public"]["Enums"]["sanction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          reason: string
          report_id?: string | null
          starts_at?: string
          type: Database["public"]["Enums"]["sanction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          reason?: string
          report_id?: string | null
          starts_at?: string
          type?: Database["public"]["Enums"]["sanction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_key: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          price: number
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_key?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          price?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_key?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          price?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_apply_violation: {
        Args: {
          p_reason: string
          p_report_id?: string
          p_severe?: boolean
          p_user: string
        }
        Returns: Database["public"]["Enums"]["sanction_type"]
      }
      admin_lift_sanction: {
        Args: { p_note: string; p_user: string }
        Returns: undefined
      }
      admin_log: {
        Args: {
          p_action: string
          p_detail: Json
          p_target_id: string
          p_target_type: string
        }
        Returns: undefined
      }
      admin_monitoring: { Args: never; Returns: Json }
      admin_process_refund: {
        Args: { p_approve: boolean; p_note: string; p_refund_id: string }
        Returns: undefined
      }
      admin_resolve_report: {
        Args: {
          p_report_id: string
          p_resolution: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      admin_set_post_visibility: {
        Args: {
          p_note: string
          p_post_id: string
          p_visibility: Database["public"]["Enums"]["visibility"]
        }
        Returns: undefined
      }
      can_act: { Args: { p_user: string }; Returns: boolean }
      cancel_subscription: { Args: never; Returns: undefined }
      chat_quota: { Args: never; Returns: Json }
      check_text: {
        Args: {
          p_scope: Database["public"]["Enums"]["word_scope"]
          p_text: string
        }
        Returns: Json
      }
      confirm_adoption: {
        Args: { p_agree_pledge?: boolean; p_room_id: string }
        Returns: Json
      }
      confirm_post_active: { Args: { p_post_id: string }; Returns: undefined }
      create_chat_room: { Args: { p_post_id: string }; Returns: string }
      enqueue_notification: {
        Args: { p_payload: Json; p_template: string; p_user: string }
        Returns: undefined
      }
      expire_canceled_subscriptions: { Args: never; Returns: undefined }
      increment_view: { Args: { p_post_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_test_mode: { Args: never; Returns: boolean }
      is_verified_user: { Args: { p_user: string }; Returns: boolean }
      kst_day_start: { Args: never; Returns: string }
      live_subscription: {
        Args: { p_user: string }
        Returns: {
          billing_key: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          price: number
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_room_read: { Args: { p_room_id: string }; Returns: undefined }
      mask_registration: { Args: { p_value: string }; Returns: string }
      process_stale_posts: { Args: never; Returns: undefined }
      purge_withdrawn: { Args: never; Returns: undefined }
      queue_renewal_reminders: { Args: never; Returns: undefined }
      refund_eligibility: { Args: { p_payment_id: string }; Returns: Json }
      renew_test_subscriptions: { Args: never; Returns: undefined }
      request_refund: {
        Args: {
          p_note?: string
          p_payment_id: string
          p_reason: Database["public"]["Enums"]["refund_reason"]
        }
        Returns: Json
      }
      resume_subscription: { Args: never; Returns: undefined }
      send_message: {
        Args: { p_body: string; p_image_path?: string; p_room_id: string }
        Returns: Json
      }
      test_start_subscription: {
        Args: {
          p_auto_billing: boolean
          p_free_rehoming: boolean
          p_no_refund_after_chat: boolean
          p_notice_version: string
        }
        Returns: string
      }
      test_verify_identity: {
        Args: { p_birth_year: number }
        Returns: undefined
      }
      text_violation: {
        Args: {
          p_scope: Database["public"]["Enums"]["word_scope"]
          p_text: string
        }
        Returns: {
          action: Database["public"]["Enums"]["word_action"]
          label: string
        }[]
      }
      withdraw_account: { Args: never; Returns: undefined }
    }
    Enums: {
      media_type: "image" | "video"
      notification_status: "pending" | "sent" | "failed" | "skipped"
      payment_status: "paid" | "failed" | "refunded"
      pet_sex: "male" | "female" | "unknown"
      pet_size: "small" | "medium" | "large"
      post_status: "active" | "adopted"
      purpose: "adopt" | "rehome"
      refund_reason: "mistake" | "duplicate" | "system_error"
      refund_status: "requested" | "completed" | "rejected"
      report_status: "open" | "resolved" | "dismissed"
      report_target: "post" | "message" | "user"
      sanction_type: "warning" | "suspend_7d" | "ban"
      subscription_status: "active" | "past_due" | "expired"
      tri_state: "yes" | "no" | "unknown"
      user_status: "active" | "suspended" | "banned"
      visibility: "visible" | "pending_review" | "hidden"
      word_action: "warn" | "block"
      word_scope: "post" | "chat" | "all"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      media_type: ["image", "video"],
      notification_status: ["pending", "sent", "failed", "skipped"],
      payment_status: ["paid", "failed", "refunded"],
      pet_sex: ["male", "female", "unknown"],
      pet_size: ["small", "medium", "large"],
      post_status: ["active", "adopted"],
      purpose: ["adopt", "rehome"],
      refund_reason: ["mistake", "duplicate", "system_error"],
      refund_status: ["requested", "completed", "rejected"],
      report_status: ["open", "resolved", "dismissed"],
      report_target: ["post", "message", "user"],
      sanction_type: ["warning", "suspend_7d", "ban"],
      subscription_status: ["active", "past_due", "expired"],
      tri_state: ["yes", "no", "unknown"],
      user_status: ["active", "suspended", "banned"],
      visibility: ["visible", "pending_review", "hidden"],
      word_action: ["warn", "block"],
      word_scope: ["post", "chat", "all"],
    },
  },
} as const
