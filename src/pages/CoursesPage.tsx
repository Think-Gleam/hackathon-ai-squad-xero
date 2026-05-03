import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { COURSE_CATALOG } from "@/lib/course-catalog";

const CoursesPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display">Professional Courses</h1>
        <p className="text-sm text-muted-foreground">Focused catalog inspired by Coursera/Udemy standards.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COURSE_CATALOG.map((course) => (
          <article key={course.slug} className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 space-y-2">
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{course.shortDescription}</p>
            </div>

            <div className="mt-auto space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Level:</span> {course.level}
              </p>
              <p>
                <span className="font-semibold text-foreground">Duration:</span> {course.durationEstimate}
              </p>
            </div>

            <Button asChild className="mt-4 w-full">
              <Link to={`/courses/${course.slug}`}>Enroll Free</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CoursesPage;