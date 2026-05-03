export type CourseLevel = "Beginner" | "Intermediate";

export type EduCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  level: CourseLevel;
  durationEstimate: string;
  whatYouWillLearn: string[];
  curriculum: string[];
};

export const COURSE_CATALOG: EduCourse[] = [
  {
    slug: "ai-fundamentals",
    title: "AI Fundamentals",
    shortDescription:
      "Beginner to Intermediate journey across AI basics, generative AI, ethics, and practical real-world use cases.",
    level: "Beginner",
    durationEstimate: "6 weeks · 4 hrs/week",
    whatYouWillLearn: [
      "Core AI concepts and modern terminology",
      "Generative AI basics and safe prompting patterns",
      "Ethical use of AI systems in academics and work",
      "How AI is used in healthcare, education, and business",
    ],
    curriculum: [
      "Week 1: Introduction to Artificial Intelligence",
      "Week 2: Generative AI and LLM Basics",
      "Week 3: Prompting and Practical Workflows",
      "Week 4: AI Ethics and Responsible Use",
      "Week 5: Industry Applications",
      "Week 6: Guided Mini Project",
    ],
  },
  {
    slug: "machine-learning-essentials",
    title: "Machine Learning Essentials",
    shortDescription:
      "Intermediate course focused on supervised and unsupervised learning, model training, evaluation, and project work.",
    level: "Intermediate",
    durationEstimate: "8 weeks · 5 hrs/week",
    whatYouWillLearn: [
      "Differentiate supervised vs unsupervised learning",
      "Train ML models with practical workflows",
      "Use evaluation metrics to compare model quality",
      "Apply ML concepts through guided projects",
    ],
    curriculum: [
      "Week 1: ML Foundations and Data Preparation",
      "Week 2: Supervised Learning Algorithms",
      "Week 3: Regression and Classification Labs",
      "Week 4: Unsupervised Learning and Clustering",
      "Week 5: Model Evaluation and Validation",
      "Week 6: Feature Engineering Basics",
      "Week 7: End-to-End ML Project",
      "Week 8: Model Review and Presentation",
    ],
  },
  {
    slug: "python-programming-for-beginners",
    title: "Python Programming for Beginners",
    shortDescription:
      "Absolute beginner-friendly path from Python fundamentals to intermediate problem-solving and small practical projects.",
    level: "Beginner",
    durationEstimate: "7 weeks · 4 hrs/week",
    whatYouWillLearn: [
      "Write clean Python syntax confidently",
      "Use conditionals, loops, functions, and core data structures",
      "Develop problem-solving habits through exercises",
      "Build mini projects using real scenarios",
    ],
    curriculum: [
      "Week 1: Python Setup and Core Syntax",
      "Week 2: Variables, Data Types, and Operators",
      "Week 3: Conditionals and Loops",
      "Week 4: Functions and Reusability",
      "Week 5: Lists, Dictionaries, and Tuples",
      "Week 6: File Handling and Error Basics",
      "Week 7: Mini Project Sprint",
    ],
  },
];

export const COURSE_BY_SLUG = Object.fromEntries(COURSE_CATALOG.map((course) => [course.slug, course]));