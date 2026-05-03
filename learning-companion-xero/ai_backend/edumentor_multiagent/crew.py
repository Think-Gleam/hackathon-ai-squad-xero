import logging
from typing import Any, Dict, TypedDict

from langgraph.graph import END, START, StateGraph

from .agents import AgentFactory
from .utils import SpeechFallbackService, STTFallbackService, b64decode_audio, b64encode_bytes

logger = logging.getLogger("edumentor.crew")


class EduMentorState(TypedDict, total=False):
    learner_profile: Dict[str, Any]
    progress_snapshot: Dict[str, Any]
    current_topic: str
    allow_web_search: bool
    target_difficulty: str

    plan: Dict[str, Any]
    teaching: Dict[str, Any]
    quiz: Dict[str, Any]
    user_answers: Dict[str, Any]
    quiz_evaluation: Dict[str, Any]
    progress_update: Dict[str, Any]

    voice_input_b64: str
    voice_input_mime_type: str
    transcribed_text: str

    voice_output: Dict[str, Any]
    run_metadata: Dict[str, Any]


class EduMentorOrchestrator:
    def __init__(self) -> None:
        self.factory = AgentFactory()
        self.repo = self.factory.repo
        self.tts = SpeechFallbackService()
        self.stt = STTFallbackService()
        self.graph = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(EduMentorState)

        graph.add_node("ingest_voice", self._ingest_voice_if_present)
        graph.add_node("planner", self._planner_node)
        graph.add_node("teacher", self._teacher_node)
        graph.add_node("quiz_generate", self._quiz_generate_node)
        graph.add_node("quiz_evaluate", self._quiz_evaluate_node)
        graph.add_node("evaluator", self._evaluator_node)
        graph.add_node("persist", self._persist_node)
        graph.add_node("voice_output", self._voice_output_node)

        graph.add_edge(START, "ingest_voice")
        graph.add_edge("ingest_voice", "planner")
        graph.add_edge("planner", "teacher")
        graph.add_edge("teacher", "quiz_generate")
        graph.add_edge("quiz_generate", "quiz_evaluate")
        graph.add_edge("quiz_evaluate", "evaluator")
        graph.add_edge("evaluator", "persist")
        graph.add_edge("persist", "voice_output")
        graph.add_edge("voice_output", END)

        return graph.compile()

    def run_full_session(self, initial_state: EduMentorState) -> EduMentorState:
        return self.graph.invoke(initial_state)

    def _ingest_voice_if_present(self, state: EduMentorState) -> EduMentorState:
        if not state.get("voice_input_b64"):
            return state

        raw = b64decode_audio(state["voice_input_b64"])
        mime = state.get("voice_input_mime_type", "audio/wav")
        stt = self.stt.transcribe(raw, mime_type=mime)

        merged = dict(state)
        merged["transcribed_text"] = stt.text
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "stt_provider": stt.provider,
        }

        if not merged.get("current_topic") and stt.text:
            merged["current_topic"] = stt.text[:140]

        return merged

    def _planner_node(self, state: EduMentorState) -> EduMentorState:
        planner = self.factory.planner()
        result = planner.run(state)
        merged = dict(state)
        merged["plan"] = result.output
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "planner_provider": result.provider,
        }
        return merged

    def _teacher_node(self, state: EduMentorState) -> EduMentorState:
        teacher = self.factory.teacher()
        result = teacher.run(state)
        merged = dict(state)
        merged["teaching"] = result.output
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "teacher_provider": result.provider,
        }
        return merged

    def _quiz_generate_node(self, state: EduMentorState) -> EduMentorState:
        quiz_agent = self.factory.quiz()
        result = quiz_agent.generate_quiz(state)
        merged = dict(state)
        merged["quiz"] = result.output
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "quiz_gen_provider": result.provider,
        }
        return merged

    def _quiz_evaluate_node(self, state: EduMentorState) -> EduMentorState:
        quiz_agent = self.factory.quiz()
        if not state.get("user_answers"):
            merged = dict(state)
            merged["quiz_evaluation"] = {
                "score_percent": 0,
                "strengths": [],
                "mistakes": ["No answers submitted yet"],
                "corrective_feedback": "Collect learner answers and re-run evaluation.",
                "suggested_next_difficulty": state.get("target_difficulty", "easy"),
            }
            return merged

        result = quiz_agent.evaluate_answers(state)
        merged = dict(state)
        merged["quiz_evaluation"] = result.output
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "quiz_eval_provider": result.provider,
        }
        return merged

    def _evaluator_node(self, state: EduMentorState) -> EduMentorState:
        evaluator = self.factory.evaluator()
        result = evaluator.run(state)
        merged = dict(state)
        merged["progress_update"] = result.output
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "evaluator_provider": result.provider,
        }
        return merged

    def _persist_node(self, state: EduMentorState) -> EduMentorState:
        merged = dict(state)
        user_id = state["learner_profile"]["user_id"]

        plan_record = self.repo.save_study_plan(
            {
                "user_id": user_id,
                "topic": state.get("current_topic", ""),
                "plan_json": state.get("plan", {}),
            }
        )

        quiz_record = self.repo.save_quiz_result(
            {
                "user_id": user_id,
                "topic": state.get("current_topic", ""),
                "quiz_json": state.get("quiz", {}),
                "answers_json": state.get("user_answers", {}),
                "evaluation_json": state.get("quiz_evaluation", {}),
            }
        )

        progress_record = self.repo.save_progress(
            {
                "user_id": user_id,
                "topic": state.get("current_topic", ""),
                "progress_json": state.get("progress_update", {}),
            }
        )

        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "persisted": {
                "plan_id": plan_record.get("id"),
                "quiz_id": quiz_record.get("id"),
                "progress_id": progress_record.get("id"),
            },
        }
        return merged

    def _voice_output_node(self, state: EduMentorState) -> EduMentorState:
        merged = dict(state)
        explanation = (state.get("teaching") or {}).get("explanation", "")
        feedback = (state.get("quiz_evaluation") or {}).get("corrective_feedback", "")
        narration = f"{explanation}\n\n{feedback}".strip()

        if not narration:
            merged["voice_output"] = {
                "provider": "none",
                "mime_type": "text/plain",
                "audio_b64": None,
                "message": "No narration available",
            }
            return merged

        audio = self.tts.synthesize(narration)
        merged["voice_output"] = {
            "provider": audio.provider,
            "mime_type": audio.mime_type,
            "audio_b64": b64encode_bytes(audio.audio_bytes),
            "message": audio.message,
        }
        merged["run_metadata"] = {
            **merged.get("run_metadata", {}),
            "tts_provider": audio.provider,
        }
        return merged
