import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List

from .utils import FallbackLLMClient, SupabaseRepository, Tooling

logger = logging.getLogger("edumentor.agents")


@dataclass
class AgentResult:
    name: str
    provider: str
    model: str
    output: Dict[str, Any]


class BaseEduMentorAgent:
    def __init__(self, name: str, llm: FallbackLLMClient, tools: Tooling) -> None:
        self.name = name
        self.llm = llm
        self.tools = tools


class PlannerAgent(BaseEduMentorAgent):
    SYSTEM_PROMPT = """
You are EduMentor Planner Agent.
Create adaptive study plans based on learner profile and progress.
Output concise JSON only.
""".strip()

    def run(self, state: Dict[str, Any]) -> AgentResult:
        learner = state["learner_profile"]
        progress = state.get("progress_snapshot") or {}

        user_prompt = f"""
Learner profile:
{json.dumps(learner, ensure_ascii=False)}

Progress snapshot:
{json.dumps(progress, ensure_ascii=False)}

Return JSON with keys:
- daily_plan: array of modules with duration_minutes, topic, difficulty, mode
- weekly_focus: array of 5-7 goals
- adaptation_notes: why plan is adjusted
""".strip()

        response, parsed = self.llm.generate_json(
            self.SYSTEM_PROMPT,
            user_prompt,
            schema_hint="{daily_plan:[], weekly_focus:[], adaptation_notes:string}",
        )

        return AgentResult(
            name=self.name,
            provider=response.provider,
            model=response.model,
            output=parsed,
        )


class TeacherAgent(BaseEduMentorAgent):
    SYSTEM_PROMPT = """
You are EduMentor Teacher Agent.
Explain concepts with Pakistani real-world examples and clear language.
Include one analogy and one practical application.
Output JSON only.
""".strip()

    def run(self, state: Dict[str, Any]) -> AgentResult:
        lesson_topic = state["current_topic"]
        learner = state["learner_profile"]

        search_results: List[Dict[str, str]] = []
        if state.get("allow_web_search", True):
            search_results = self.tools.web_search(f"Pakistan example for {lesson_topic}", limit=3)

        user_prompt = f"""
Topic: {lesson_topic}
Learner profile: {json.dumps(learner, ensure_ascii=False)}
Optional context from web search: {json.dumps(search_results, ensure_ascii=False)}

Return JSON with:
- explanation
- pakistani_examples (array, min 2)
- analogy
- key_takeaways (array)
""".strip()

        response, parsed = self.llm.generate_json(
            self.SYSTEM_PROMPT,
            user_prompt,
            schema_hint="{explanation:string,pakistani_examples:[],analogy:string,key_takeaways:[]}",
        )

        return AgentResult(
            name=self.name,
            provider=response.provider,
            model=response.model,
            output=parsed,
        )


class QuizAgent(BaseEduMentorAgent):
    SYSTEM_PROMPT = """
You are EduMentor Quiz Agent.
Create adaptive quizzes and evaluate answers fairly.
Output JSON only.
""".strip()

    def generate_quiz(self, state: Dict[str, Any]) -> AgentResult:
        topic = state["current_topic"]
        learner = state["learner_profile"]
        difficulty = state.get("target_difficulty", "medium")

        user_prompt = f"""
Create a quiz for topic: {topic}
Learner: {json.dumps(learner, ensure_ascii=False)}
Difficulty: {difficulty}

Return JSON with:
- mcq_questions: array of objects (question, options[4], answer_index, rationale)
- short_answer_questions: array of objects (question, rubric)
""".strip()

        response, parsed = self.llm.generate_json(
            self.SYSTEM_PROMPT,
            user_prompt,
            schema_hint="{mcq_questions:[], short_answer_questions:[]}",
        )

        return AgentResult(self.name, response.provider, response.model, parsed)

    def evaluate_answers(self, state: Dict[str, Any]) -> AgentResult:
        quiz_payload = state["quiz"]
        answers = state["user_answers"]

        user_prompt = f"""
Quiz:
{json.dumps(quiz_payload, ensure_ascii=False)}

Learner answers:
{json.dumps(answers, ensure_ascii=False)}

Return JSON with:
- score_percent
- strengths (array)
- mistakes (array)
- corrective_feedback
- suggested_next_difficulty (easy|medium|hard)
""".strip()

        response, parsed = self.llm.generate_json(
            self.SYSTEM_PROMPT,
            user_prompt,
            schema_hint="{score_percent:number,strengths:[],mistakes:[],corrective_feedback:string,suggested_next_difficulty:string}",
        )

        return AgentResult(self.name, response.provider, response.model, parsed)


class EvaluatorAgent(BaseEduMentorAgent):
    SYSTEM_PROMPT = """
You are EduMentor Evaluator Agent.
Track mastery and adapt path when learner struggles.
Output JSON only.
""".strip()

    def run(self, state: Dict[str, Any]) -> AgentResult:
        learner = state["learner_profile"]
        plan = state["plan"]
        evaluation = state["quiz_evaluation"]

        user_prompt = f"""
Learner profile: {json.dumps(learner, ensure_ascii=False)}
Plan output: {json.dumps(plan, ensure_ascii=False)}
Quiz evaluation: {json.dumps(evaluation, ensure_ascii=False)}

Return JSON with:
- mastery_level (0-100)
- struggling_areas (array)
- intervention (repeat|simplify|advance)
- next_actions (array)
""".strip()

        response, parsed = self.llm.generate_json(
            self.SYSTEM_PROMPT,
            user_prompt,
            schema_hint="{mastery_level:number,struggling_areas:[],intervention:string,next_actions:[]}",
        )

        return AgentResult(self.name, response.provider, response.model, parsed)


class AgentFactory:
    def __init__(self) -> None:
        self.llm = FallbackLLMClient()
        self.repo = SupabaseRepository()
        self.tools = Tooling(self.repo)

    def planner(self) -> PlannerAgent:
        return PlannerAgent("planner", self.llm, self.tools)

    def teacher(self) -> TeacherAgent:
        return TeacherAgent("teacher", self.llm, self.tools)

    def quiz(self) -> QuizAgent:
        return QuizAgent("quiz", self.llm, self.tools)

    def evaluator(self) -> EvaluatorAgent:
        return EvaluatorAgent("evaluator", self.llm, self.tools)
