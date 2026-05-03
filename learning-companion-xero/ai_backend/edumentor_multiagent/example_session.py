import json
from pathlib import Path

from dotenv import load_dotenv

from .crew import EduMentorOrchestrator

load_dotenv()


def run_demo() -> None:
    orchestrator = EduMentorOrchestrator()

    initial_state = {
        "learner_profile": {
            "user_id": "demo-user-001",
            "name": "Areeba",
            "age": 16,
            "grade_level": "Grade 11",
            "goal": "Improve algebra and physics fundamentals",
            "preferred_language": "English",
            "learning_style": "voice-first",
        },
        "progress_snapshot": {
            "math_mastery": 52,
            "physics_mastery": 47,
            "recent_quiz_avg": 58,
            "struggling_topics": ["quadratic equations", "vectors"],
        },
        "current_topic": "Quadratic equations and practical applications",
        "target_difficulty": "medium",
        "allow_web_search": True,
        "user_answers": {
            "mcq": [1, 2, 0],
            "short": {
                "q1": "Discriminant tells roots nature and helps in decision making in real examples.",
            },
        },
    }

    final_state = orchestrator.run_full_session(initial_state)

    out_path = Path("/tmp/edumentor_session_output.json")
    out_path.write_text(json.dumps(final_state, indent=2, ensure_ascii=False), encoding="utf-8")

    print("Session complete.")
    print(f"Planner provider: {final_state.get('run_metadata', {}).get('planner_provider')}")
    print(f"Teacher provider: {final_state.get('run_metadata', {}).get('teacher_provider')}")
    print(f"Quiz provider: {final_state.get('run_metadata', {}).get('quiz_gen_provider')}")
    print(f"Evaluator provider: {final_state.get('run_metadata', {}).get('evaluator_provider')}")
    print(f"TTS provider: {final_state.get('run_metadata', {}).get('tts_provider')}")
    print(f"Persisted IDs: {final_state.get('run_metadata', {}).get('persisted')}")
    print(f"Full output JSON: {out_path}")


if __name__ == "__main__":
    run_demo()
