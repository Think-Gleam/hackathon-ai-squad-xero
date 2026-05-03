# EduMentor: The Adaptive AI Learning Companion

> **Level up learning with an AI tutor that explains, adapts, and motivates — one concept at a time.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwind-css&logoColor=38BDF8)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-111827?style=for-the-badge&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-0F172A?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Gemini API](https://img.shields.io/badge/Gemini_API-1A73E8?style=for-the-badge&logo=google&logoColor=white)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-111111?style=for-the-badge&logo=waveform&logoColor=white)

## Overview

Traditional learning platforms often present static content that cannot adapt to how each student thinks, struggles, or learns best. Learners are left with one-size-fits-all explanations, limited engagement loops, and weak feedback signals that make it hard to build confidence and sustain momentum.

**EduMentor** solves this by combining adaptive AI tutoring, micro-syllabus progression, and gamified motivation into a single experience. It breaks down difficult topics with real-world analogies, tracks mastery dynamically, and supports multimodal accessibility through text-to-speech—helping learners understand faster, retain longer, and stay engaged day after day.

## Key Features

- **Interactive AI Tutor**
  - Conversational tutoring powered by LLMs.
  - Rich Markdown rendering for structured explanations, examples, lists, and code-style formatting where needed.

- **Adaptive Micro-Syllabus & Gamification**
  - Personalized learning paths that evolve based on learner progress.
  - Motivation systems including **XP**, **streaks**, and **badges** to reinforce consistency and mastery.

- **Multimodal Accessibility (“Listen to the Tutor”)**
  - Audio-first reinforcement with **ElevenLabs** and/or the **Native Web Speech API**.
  - Supports different learning preferences and improves accessibility for diverse users.

- **Real-time Quiz Engine & Assessment**
  - In-session quizzes to validate understanding immediately.
  - Instant feedback loops to identify weak points and guide next-step remediation.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| UI & Styling | Tailwind CSS + shadcn/ui |
| Backend Services | Supabase (Database + Auth) |
| AI / LLM | Gemini API |
| Voice / Audio | ElevenLabs + Native Web Speech API |

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd hackathon-ai-squad-xero
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   > If `.env.example` is not present, create `.env` manually and add the variables listed below.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Visit the local URL shown in your terminal (typically `http://localhost:5173`).

## Environment Variables

Create a `.env` file in the project root and define the following variables:

```env
VITE_GEMINI_API_KEY=
VITE_ELEVENLABS_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> Never commit real API keys or secrets to source control.

## Future Roadmap

Post-MVP improvements planned for EduMentor:

- **Advanced Learning Analytics**
  - Concept-level mastery dashboards, weak-topic heatmaps, and progress forecasting.

- **Collaborative Learning Modes**
  - Study groups, peer challenges, and mentor-led cohort rooms.

- **Expanded Content Intelligence**
  - Curriculum-aligned topic packs, adaptive revision plans, and exam-mode simulations.

- **Cross-Platform Experience**
  - PWA hardening, offline study support, and mobile-optimized interaction patterns.
