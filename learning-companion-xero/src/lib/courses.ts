export type Course = {
  id: "ai-fundamentals" | "ml-essentials" | "python-for-beginners";
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Beginner to Intermediate" | "Absolute Beginner";
  duration: string;
  covers: string[];
  curriculum: string[];
  outcomes: string[];
};

export const courses: Course[] = [
  {
    id: "ai-fundamentals",
    title: "AI Fundamentals",
    description:
      "A practical foundation in modern AI with clear explanations and real-world context.",
    level: "Beginner to Intermediate",
    duration: "6 weeks · 4-5 hrs/week",
    covers: ["Introduction to AI", "Generative AI", "Ethics", "Real-world applications"],
    curriculum: [
      "Week 1: AI concepts, history, and terminology",
      "Week 2: How machine intelligence works in products",
      "Week 3: Generative AI workflows and prompting",
      "Week 4: Responsible AI and ethics",
      "Week 5: Industry use-cases and mini case studies",
      "Week 6: Capstone reflection and practical roadmap",
    ],
    outcomes: [
      "Explain core AI and Generative AI concepts confidently",
      "Assess ethical implications in AI-assisted workflows",
      "Map AI use-cases to education, business, and daily life",
    ],
  },
  {
    id: "ml-essentials",
    title: "Machine Learning Essentials",
    description:
      "Build practical ML intuition through guided model-building, evaluation, and project work.",
    level: "Intermediate",
    duration: "8 weeks · 5-6 hrs/week",
    covers: [
      "Supervised Learning",
      "Unsupervised Learning",
      "Model Training",
      "Evaluation",
      "Practical Projects",
    ],
    curriculum: [
      "Week 1: ML lifecycle and dataset preparation",
      "Week 2: Supervised learning and baselines",
      "Week 3: Classification and regression workflows",
      "Week 4: Unsupervised learning and clustering",
      "Week 5: Feature engineering and tuning",
      "Week 6: Evaluation metrics and model comparison",
      "Week 7: Practical mini project",
      "Week 8: Final project and model review",
    ],
    outcomes: [
      "Train and evaluate ML models end-to-end",
      "Select suitable algorithms for common problem types",
      "Ship small practical projects with clear reporting",
    ],
  },
  {
    id: "python-for-beginners",
    title: "Python Programming for Beginners",
    description:
      "A beginner-friendly path from first syntax to structured problem-solving and mini projects.",
    level: "Absolute Beginner",
    duration: "7 weeks · 4 hrs/week",
    covers: [
      "Python basics to intermediate",
      "Problem-solving",
      "Small projects",
    ],
    curriculum: [
      "Week 1: Variables, data types, and operators",
      "Week 2: Conditions, loops, and logic",
      "Week 3: Functions and modular thinking",
      "Week 4: Lists, dictionaries, and strings",
      "Week 5: File handling and error handling",
      "Week 6: Problem-solving patterns",
      "Week 7: Small projects and best practices",
    ],
    outcomes: [
      "Write clean Python scripts independently",
      "Solve beginner/intermediate coding problems",
      "Build small practical projects with confidence",
    ],
  },
];

export function getCourseById(courseId: string) {
  return courses.find((course) => course.id === courseId);
}