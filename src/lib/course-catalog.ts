import { supabase } from "@/integrations/supabase/client";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type EduCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  level: CourseLevel;
  durationEstimate: string;
  whatYouWillLearn: string[];
  curriculum: string[];
};

const normalizeLevel = (level: string): CourseLevel => {
  if (level === "advanced") return "Advanced";
  if (level === "intermediate") return "Intermediate";
  return "Beginner";
};

const mapCourseRow = (row: any): EduCourse => ({
  slug: row.slug,
  title: row.title,
  shortDescription: row.short_description,
  level: normalizeLevel(row.level),
  durationEstimate: row.duration_estimate,
  whatYouWillLearn: row.what_you_will_learn ?? [],
  curriculum: row.curriculum ?? [],
});

export const fetchAvailableCourses = async (): Promise<EduCourse[]> => {
  const { data, error } = await (supabase as any)
    .from("course_catalog")
    .select("slug,title,short_description,level,duration_estimate,what_you_will_learn,curriculum")
    .eq("is_available", true)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapCourseRow);
};

export const fetchAvailableCourseBySlug = async (slug: string): Promise<EduCourse | null> => {
  const { data, error } = await (supabase as any)
    .from("course_catalog")
    .select("slug,title,short_description,level,duration_estimate,what_you_will_learn,curriculum")
    .eq("slug", slug)
    .eq("is_available", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapCourseRow(data) : null;
};