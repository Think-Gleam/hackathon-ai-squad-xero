import { createFileRoute } from "@tanstack/react-router";
import { Award, Flame, Star } from "lucide-react";
import { MentorLayout } from "@/components/mentor-layout";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/")({
  component: Index,
});

const dashboardStats = [
  { label: "Current Streak", value: "3 Days", icon: Flame },
  { label: "XP Points", value: "1,250 XP", icon: Star },
  { label: "Badges", value: "Fast Learner", icon: Award },
];
const activeCourses = [
  { ...courses[0], progress: 40 },
  { ...courses[1], progress: 15 },
  { ...courses[2], progress: 80 },
];

function Index() {
  return (
    <MentorLayout>
      <header className="mentor-greeting">
        <p className="text-sm text-muted-foreground">EduMentor Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          Good morning, Emma! 👋 What would you like to learn today?
        </h1>
      </header>

      <section className="mentor-stats" aria-label="Quick Stats">
        {dashboardStats.map((stat) => (
          <article key={stat.label} className="mentor-stat-card">
            <div className="mentor-stat-icon">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold text-foreground">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8" aria-labelledby="continue-learning-title">
        <h2 id="continue-learning-title" className="text-xl font-semibold text-foreground">
          Continue Where You Left Off
        </h2>

        <div className="mentor-course-list">
          {activeCourses.map((course) => (
            <article key={course.id} className="mentor-course-card">
              <div className="mentor-course-main">
                <h3 className="text-base font-semibold text-foreground">{course.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="mentor-progress-track mt-2" role="progressbar" aria-valuenow={course.progress}>
                    <div className="mentor-progress-fill" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              </div>

              <button className="mentor-resume-button" type="button">
                Resume Learning
              </button>
            </article>
          ))}
        </div>
      </section>
    </MentorLayout>
  );
}
