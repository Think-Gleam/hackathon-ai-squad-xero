import type { Database } from "@/integrations/supabase/types";

export const learnerSegments: Array<{
  label: string;
  value: Database["public"]["Enums"]["learner_segment"];
}> = [
  { label: "Kid / Primary", value: "kid_primary" },
  { label: "Middle School", value: "middle_school" },
  { label: "High School", value: "high_school" },
  { label: "University Student", value: "university_student" },
  { label: "Working Professional", value: "working_professional" },
  { label: "Parent", value: "parent" },
];

export const languageOptions: Array<{
  label: string;
  value: Database["public"]["Enums"]["preferred_language"];
}> = [
  { label: "English", value: "english" },
  { label: "Urdu", value: "urdu" },
  { label: "Bilingual", value: "bilingual" },
];

export const educationLevels: Array<{
  label: string;
  value: Database["public"]["Enums"]["education_level"];
}> = [
  { label: "Primary", value: "primary" },
  { label: "Middle", value: "middle" },
  { label: "Secondary", value: "secondary" },
  { label: "Higher Secondary", value: "higher_secondary" },
  { label: "Undergraduate", value: "undergraduate" },
  { label: "Postgraduate", value: "postgraduate" },
  { label: "Other", value: "other" },
];