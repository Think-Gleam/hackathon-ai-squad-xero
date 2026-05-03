import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MentorLayout } from "@/components/mentor-layout";
import { getCourseById } from "@/lib/courses";

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const course = getCourseById(courseId);

  if (!course) {
    throw notFound();
  }

  return (
    <MentorLayout>
      <header className="mentor-greeting">
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">{course.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border bg-secondary px-2 py-1">{course.level}</span>
          <span className="rounded-md border border-border bg-secondary px-2 py-1">{course.duration}</span>
        </div>
      </header>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-md border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">Curriculum</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.curriculum.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-md border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">What you'll learn</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.outcomes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <button type="button" className="mentor-resume-button mt-5">
            Start Course
          </button>
        </article>
      </section>
    </MentorLayout>
  );
}