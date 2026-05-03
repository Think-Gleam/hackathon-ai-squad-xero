import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { COURSE_CATALOG } from "@/lib/course-catalog";

const CourseDetailPage = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();

  const course = useMemo(() => COURSE_CATALOG.find((item) => item.slug === courseSlug), [courseSlug]);

  if (!course) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-display">Course not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please return to the focused course catalog.</p>
        <Button asChild className="mt-5">
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <header className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">{course.level}</p>
        <h1 className="mt-1 text-3xl font-display">{course.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{course.shortDescription}</p>
        <p className="mt-3 text-sm text-muted-foreground">Duration: {course.durationEstimate}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">What you'll learn</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.whatYouWillLearn.map((item) => (
              <li key={item} className="rounded-md bg-secondary/40 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Curriculum</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.curriculum.map((module) => (
              <li key={module} className="rounded-md bg-secondary/40 px-3 py-2">
                {module}
              </li>
            ))}
          </ol>
        </article>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button>Start Course</Button>
        <Button variant="outline" asChild>
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </div>
    </section>
  );
};

export default CourseDetailPage;