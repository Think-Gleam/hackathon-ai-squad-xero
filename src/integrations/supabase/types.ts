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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accomplishments: {
        Row: {
          accomplishment_type: Database["public"]["Enums"]["accomplishment_type"]
          course_slug: string | null
          created_at: string
          description: string
          id: string
          issued_at: string
          metadata: Json
          profile_id: string
          title: string
        }
        Insert: {
          accomplishment_type?: Database["public"]["Enums"]["accomplishment_type"]
          course_slug?: string | null
          created_at?: string
          description: string
          id?: string
          issued_at?: string
          metadata?: Json
          profile_id: string
          title: string
        }
        Update: {
          accomplishment_type?: Database["public"]["Enums"]["accomplishment_type"]
          course_slug?: string | null
          created_at?: string
          description?: string
          id?: string
          issued_at?: string
          metadata?: Json
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "accomplishments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_execution_logs: {
        Row: {
          agent: Database["public"]["Enums"]["agent_name"]
          course_slug: string | null
          created_at: string
          id: string
          input_payload: Json
          module_id: string | null
          output_payload: Json
          profile_id: string
        }
        Insert: {
          agent: Database["public"]["Enums"]["agent_name"]
          course_slug?: string | null
          created_at?: string
          id?: string
          input_payload?: Json
          module_id?: string | null
          output_payload?: Json
          profile_id: string
        }
        Update: {
          agent?: Database["public"]["Enums"]["agent_name"]
          course_slug?: string | null
          created_at?: string
          id?: string
          input_payload?: Json
          module_id?: string | null
          output_payload?: Json
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_execution_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          key: string
          label: string
          module_threshold: number
          xp_threshold: number
        }
        Insert: {
          created_at?: string
          description: string
          key: string
          label: string
          module_threshold?: number
          xp_threshold?: number
        }
        Update: {
          created_at?: string
          description?: string
          key?: string
          label?: string
          module_threshold?: number
          xp_threshold?: number
        }
        Relationships: []
      }
      course_catalog: {
        Row: {
          created_at: string
          curriculum: string[]
          duration_estimate: string
          is_available: boolean
          level: Database["public"]["Enums"]["course_level"]
          short_description: string
          slug: string
          title: string
          updated_at: string
          what_you_will_learn: string[]
        }
        Insert: {
          created_at?: string
          curriculum?: string[]
          duration_estimate: string
          is_available?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          short_description: string
          slug: string
          title: string
          updated_at?: string
          what_you_will_learn?: string[]
        }
        Update: {
          created_at?: string
          curriculum?: string[]
          duration_estimate?: string
          is_available?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          short_description?: string
          slug?: string
          title?: string
          updated_at?: string
          what_you_will_learn?: string[]
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          complexity_mode: Database["public"]["Enums"]["content_complexity"]
          course_slug: string
          course_title: string
          created_at: string
          current_module_index: number
          id: string
          mastery_score: number
          pace_mode: Database["public"]["Enums"]["adaptive_pace"]
          preferred_language: Database["public"]["Enums"]["preferred_language"]
          profile_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
        }
        Insert: {
          complexity_mode?: Database["public"]["Enums"]["content_complexity"]
          course_slug: string
          course_title: string
          created_at?: string
          current_module_index?: number
          id?: string
          mastery_score?: number
          pace_mode?: Database["public"]["Enums"]["adaptive_pace"]
          preferred_language?: Database["public"]["Enums"]["preferred_language"]
          profile_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
        }
        Update: {
          complexity_mode?: Database["public"]["Enums"]["content_complexity"]
          course_slug?: string
          course_title?: string
          created_at?: string
          current_module_index?: number
          id?: string
          mastery_score?: number
          pace_mode?: Database["public"]["Enums"]["adaptive_pace"]
          preferred_language?: Database["public"]["Enums"]["preferred_language"]
          profile_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_learning_plans: {
        Row: {
          course_slug: string
          created_at: string
          focus_minutes: number
          id: string
          module_ids: string[]
          plan_date: string
          planner_notes: string | null
          profile_id: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          focus_minutes?: number
          id?: string
          module_ids?: string[]
          plan_date?: string
          planner_notes?: string | null
          profile_id: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          focus_minutes?: number
          id?: string
          module_ids?: string[]
          plan_date?: string
          planner_notes?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_learning_plans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earned_badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          profile_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earned_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "earned_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          attempts_count: number
          created_at: string
          difficulty_level: Database["public"]["Enums"]["module_difficulty"]
          enrollment_id: string
          estimated_minutes: number
          id: string
          lesson_content: string | null
          lesson_summary: string | null
          max_attempts: number
          module_goal: string
          module_index: number
          module_title: string
          pakistan_context_examples: string[]
          unlock_state: Database["public"]["Enums"]["module_unlock_state"]
          updated_at: string
          voice_script: string | null
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["module_difficulty"]
          enrollment_id: string
          estimated_minutes?: number
          id?: string
          lesson_content?: string | null
          lesson_summary?: string | null
          max_attempts?: number
          module_goal: string
          module_index: number
          module_title: string
          pakistan_context_examples?: string[]
          unlock_state?: Database["public"]["Enums"]["module_unlock_state"]
          updated_at?: string
          voice_script?: string | null
        }
        Update: {
          attempts_count?: number
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["module_difficulty"]
          enrollment_id?: string
          estimated_minutes?: number
          id?: string
          lesson_content?: string | null
          lesson_summary?: string | null
          max_attempts?: number
          module_goal?: string
          module_index?: number
          module_title?: string
          pakistan_context_examples?: string[]
          unlock_state?: Database["public"]["Enums"]["module_unlock_state"]
          updated_at?: string
          voice_script?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          current_education_level:
            | Database["public"]["Enums"]["education_level"]
            | null
          date_of_birth: string | null
          full_name: string
          id: string
          learner_stage: Database["public"]["Enums"]["user_stage"]
          learning_goals: string[]
          onboarding_completed: boolean
          onboarding_interests: string[]
          preferred_language: Database["public"]["Enums"]["preferred_language"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          current_education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          date_of_birth?: string | null
          full_name?: string
          id: string
          learner_stage?: Database["public"]["Enums"]["user_stage"]
          learning_goals?: string[]
          onboarding_completed?: boolean
          onboarding_interests?: string[]
          preferred_language?: Database["public"]["Enums"]["preferred_language"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          current_education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          date_of_birth?: string | null
          full_name?: string
          id?: string
          learner_stage?: Database["public"]["Enums"]["user_stage"]
          learning_goals?: string[]
          onboarding_completed?: boolean
          onboarding_interests?: string[]
          preferred_language?: Database["public"]["Enums"]["preferred_language"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempt_no: number
          correct_count: number
          created_at: string
          difficulty_applied: Database["public"]["Enums"]["module_difficulty"]
          feedback: string | null
          id: string
          module_id: string
          profile_id: string
          question_count: number
          recommended_next_action: string | null
          score_percent: number
        }
        Insert: {
          attempt_no: number
          correct_count?: number
          created_at?: string
          difficulty_applied?: Database["public"]["Enums"]["module_difficulty"]
          feedback?: string | null
          id?: string
          module_id: string
          profile_id: string
          question_count?: number
          recommended_next_action?: string | null
          score_percent?: number
        }
        Update: {
          attempt_no?: number
          correct_count?: number
          created_at?: string
          difficulty_applied?: Database["public"]["Enums"]["module_difficulty"]
          feedback?: string | null
          id?: string
          module_id?: string
          profile_id?: string
          question_count?: number
          recommended_next_action?: string | null
          score_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          correct_answers: number
          course_slug: string
          created_at: string
          enrollment_id: string | null
          id: string
          is_passed: boolean
          module_id: string | null
          profile_id: string
          score_percent: number
          source: string
          topic: string
          total_questions: number
        }
        Insert: {
          correct_answers: number
          course_slug: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          is_passed?: boolean
          module_id?: string | null
          profile_id: string
          score_percent: number
          source?: string
          topic: string
          total_questions: number
        }
        Update: {
          correct_answers?: number
          course_slug?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          is_passed?: boolean
          module_id?: string | null
          profile_id?: string
          score_percent?: number
          source?: string
          topic?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          id: string
          metadata: Json
          profile_id: string
          reference_module_id: string | null
          xp_delta: number
        }
        Insert: {
          activity_date?: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          metadata?: Json
          profile_id: string
          reference_module_id?: string | null
          xp_delta?: number
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          metadata?: Json
          profile_id?: string
          reference_module_id?: string | null
          xp_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_reference_module_id_fkey"
            columns: ["reference_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          audio_duration_seconds: number | null
          course_slug: string | null
          created_at: string
          id: string
          input_text: string | null
          metadata: Json
          mode: Database["public"]["Enums"]["voice_mode"]
          module_id: string | null
          profile_id: string
          provider: string
          status: string
          transcript_text: string | null
        }
        Insert: {
          audio_duration_seconds?: number | null
          course_slug?: string | null
          created_at?: string
          id?: string
          input_text?: string | null
          metadata?: Json
          mode: Database["public"]["Enums"]["voice_mode"]
          module_id?: string | null
          profile_id: string
          provider: string
          status?: string
          transcript_text?: string | null
        }
        Update: {
          audio_duration_seconds?: number | null
          course_slug?: string | null
          created_at?: string
          id?: string
          input_text?: string | null
          metadata?: Json
          mode?: Database["public"]["Enums"]["voice_mode"]
          module_id?: string | null
          profile_id?: string
          provider?: string
          status?: string
          transcript_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_profile_id_fkey"
            columns: ["profile_id"]
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
      apply_module_evaluation: {
        Args: {
          _correct_count: number
          _feedback?: string
          _module_id: string
          _profile_id: string
          _question_count: number
          _score_percent: number
        }
        Returns: {
          enrollment_completed: boolean
          next_action: string
          unlocked_module_id: string
          updated_mastery_score: number
        }[]
      }
      compute_gamification_summary: {
        Args: { _profile_id: string }
        Returns: {
          current_streak: number
          total_badges: number
          total_xp: number
        }[]
      }
      try_award_badges: { Args: { _profile_id: string }; Returns: undefined }
    }
    Enums: {
      accomplishment_type: "certificate" | "milestone"
      activity_type:
        | "login"
        | "module_completed"
        | "quiz_completed"
        | "lesson_interaction"
      adaptive_pace: "supportive" | "balanced" | "accelerated"
      agent_name: "planner" | "teacher" | "quiz" | "evaluator" | "tutor"
      content_complexity: "simple" | "standard" | "advanced"
      course_level: "beginner" | "intermediate" | "advanced"
      education_level:
        | "primary"
        | "middle"
        | "secondary"
        | "higher_secondary"
        | "undergraduate"
        | "postgraduate"
        | "other"
      enrollment_status: "active" | "completed" | "paused"
      module_difficulty: "beginner" | "intermediate" | "advanced"
      module_unlock_state: "locked" | "unlocked" | "completed"
      plan_status: "pending" | "completed" | "skipped"
      preferred_language: "english" | "urdu" | "bilingual"
      user_stage:
        | "kid_primary"
        | "middle_school"
        | "high_school"
        | "university_student"
        | "working_professional"
        | "parent"
      voice_mode: "tts" | "stt" | "duplex"
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
      accomplishment_type: ["certificate", "milestone"],
      activity_type: [
        "login",
        "module_completed",
        "quiz_completed",
        "lesson_interaction",
      ],
      adaptive_pace: ["supportive", "balanced", "accelerated"],
      agent_name: ["planner", "teacher", "quiz", "evaluator", "tutor"],
      content_complexity: ["simple", "standard", "advanced"],
      course_level: ["beginner", "intermediate", "advanced"],
      education_level: [
        "primary",
        "middle",
        "secondary",
        "higher_secondary",
        "undergraduate",
        "postgraduate",
        "other",
      ],
      enrollment_status: ["active", "completed", "paused"],
      module_difficulty: ["beginner", "intermediate", "advanced"],
      module_unlock_state: ["locked", "unlocked", "completed"],
      plan_status: ["pending", "completed", "skipped"],
      preferred_language: ["english", "urdu", "bilingual"],
      user_stage: [
        "kid_primary",
        "middle_school",
        "high_school",
        "university_student",
        "working_professional",
        "parent",
      ],
      voice_mode: ["tts", "stt", "duplex"],
    },
  },
} as const
