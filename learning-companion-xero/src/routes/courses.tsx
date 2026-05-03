import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MentorLayout } from "@/components/mentor-layout";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <MentorLayout>
      <header className="mentor-greeting">
        <p className="text-sm text-muted-foreground">Professional Course Catalog</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Courses</h1>
      </header>

      <section className="mentor-course-list" aria-label="Available Courses">
        {courses.map((course) => (
          <article key={course.id} className="mentor-course-card">
            <div className="mentor-course-main">
              <h2 className="text-lg font-semibold text-foreground">{course.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border border-border bg-secondary px-2 py-1">{course.level}</span>
                <span className="rounded-md border border-border bg-secondary px-2 py-1">{course.duration}</span>
              </div>
            </div>

            <Link className="mentor-resume-button" to="/courses/$courseId" params={{ courseId: course.id }}>
              Enroll Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>
    </MentorLayout>
  );
}