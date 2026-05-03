import base64
import json
import logging
import os
import re
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger("edumentor.utils")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


class ProviderError(Exception):
    pass


@dataclass
class LLMResponse:
    provider: str
    model: str
    text: str


@dataclass
class AudioResponse:
    provider: str
    mime_type: str
    audio_bytes: Optional[bytes]
    message: Optional[str] = None


@dataclass
class STTResponse:
    provider: str
    text: str
    confidence: Optional[float] = None


class SupabaseRepository:
    """Thin persistence layer for EduMentor entities."""

    def __init__(self) -> None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY are required")
        self.client: Client = create_client(url, key)

        self.study_plan_table = os.getenv("STUDY_PLAN_TABLE", "edumentor_study_plans")
        self.quiz_table = os.getenv("QUIZ_RESULT_TABLE", "edumentor_quiz_results")
        self.progress_table = os.getenv("PROGRESS_TABLE", "edumentor_progress")

    def save_study_plan(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("id", str(uuid.uuid4()))
        payload.setdefault("created_at", int(time.time()))
        result = self.client.table(self.study_plan_table).insert(payload).execute()
        return result.data[0] if result.data else payload

    def save_quiz_result(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("id", str(uuid.uuid4()))
        payload.setdefault("created_at", int(time.time()))
        result = self.client.table(self.quiz_table).insert(payload).execute()
        return result.data[0] if result.data else payload

    def save_progress(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("id", str(uuid.uuid4()))
        payload.setdefault("created_at", int(time.time()))
        result = self.client.table(self.progress_table).insert(payload).execute()
        return result.data[0] if result.data else payload

    def get_latest_progress(self, user_id: str) -> Optional[Dict[str, Any]]:
        result = (
            self.client.table(self.progress_table)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
        return None


class Tooling:
    def __init__(self, repo: SupabaseRepository):
        self.repo = repo

    def web_search(self, query: str, limit: int = 5) -> List[Dict[str, str]]:
        """Simple web search using DuckDuckGo instant answer API."""
        try:
            url = "https://api.duckduckgo.com/"
            params = {"q": query, "format": "json", "no_html": 1, "no_redirect": 1}
            response = requests.get(url, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()

            results: List[Dict[str, str]] = []
            abstract = data.get("AbstractText")
            if abstract:
                results.append(
                    {
                        "title": data.get("Heading") or query,
                        "snippet": abstract,
                        "url": data.get("AbstractURL", ""),
                    }
                )

            for topic in data.get("RelatedTopics", [])[: limit * 2]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append(
                        {
                            "title": topic.get("Text", "")[:90],
                            "snippet": topic.get("Text", ""),
                            "url": topic.get("FirstURL", ""),
                        }
                    )
                if len(results) >= limit:
                    break

            return results[:limit]
        except Exception as exc:
            logger.warning("Web search failed: %s", exc)
            return []


class FallbackLLMClient:
    """Provider chain: Gemini -> Groq -> OpenRouter -> HuggingFace."""

    def __init__(self) -> None:
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.hf_key = os.getenv("HUGGINGFACE_API_KEY")

        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
        self.hf_model = os.getenv("HUGGINGFACE_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1200,
    ) -> LLMResponse:
        attempts: List[Tuple[str, Any]] = [
            ("gemini", self._call_gemini),
            ("groq", self._call_groq),
            ("openrouter", self._call_openrouter),
            ("huggingface", self._call_huggingface),
        ]

        failures = []
        for provider, fn in attempts:
            try:
                return fn(system_prompt, user_prompt, temperature, max_tokens)
            except Exception as exc:
                logger.warning("LLM provider %s failed: %s", provider, exc)
                failures.append(f"{provider}: {exc}")

        raise ProviderError("All LLM providers failed -> " + " | ".join(failures))

    def generate_json(self, system_prompt: str, user_prompt: str, schema_hint: str) -> Tuple[LLMResponse, Dict[str, Any]]:
        enforce = (
            "Return ONLY valid JSON. No markdown. No explanation. "
            f"Schema hint: {schema_hint}"
        )
        response = self.generate_text(system_prompt + "\n" + enforce, user_prompt)
        parsed = extract_json_object(response.text)
        return response, parsed

    def _call_gemini(self, system_prompt: str, user_prompt: str, temperature: float, max_tokens: int) -> LLMResponse:
        if not self.gemini_key:
            raise ProviderError("Missing GEMINI_API_KEY")
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        res = requests.post(endpoint, json=payload, timeout=45)
        res.raise_for_status()
        data = res.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return LLMResponse(provider="gemini", model=self.gemini_model, text=text)

    def _call_groq(self, system_prompt: str, user_prompt: str, temperature: float, max_tokens: int) -> LLMResponse:
        if not self.groq_key:
            raise ProviderError("Missing GROQ_API_KEY")
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": self.groq_model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"}
        res = requests.post(endpoint, headers=headers, json=payload, timeout=45)
        res.raise_for_status()
        text = res.json()["choices"][0]["message"]["content"]
        return LLMResponse(provider="groq", model=self.groq_model, text=text)

    def _call_openrouter(self, system_prompt: str, user_prompt: str, temperature: float, max_tokens: int) -> LLMResponse:
        if not self.openrouter_key:
            raise ProviderError("Missing OPENROUTER_API_KEY")
        endpoint = "https://openrouter.ai/api/v1/chat/completions"
        payload = {
            "model": self.openrouter_model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {"Authorization": f"Bearer {self.openrouter_key}", "Content-Type": "application/json"}
        res = requests.post(endpoint, headers=headers, json=payload, timeout=45)
        res.raise_for_status()
        text = res.json()["choices"][0]["message"]["content"]
        return LLMResponse(provider="openrouter", model=self.openrouter_model, text=text)

    def _call_huggingface(self, system_prompt: str, user_prompt: str, temperature: float, max_tokens: int) -> LLMResponse:
        if not self.hf_key:
            raise ProviderError("Missing HUGGINGFACE_API_KEY")
        endpoint = f"https://api-inference.huggingface.co/models/{self.hf_model}"
        prompt = f"[SYSTEM]\n{system_prompt}\n\n[USER]\n{user_prompt}\n\n[ASSISTANT]\n"
        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False,
            },
        }
        headers = {"Authorization": f"Bearer {self.hf_key}", "Content-Type": "application/json"}
        res = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        res.raise_for_status()
        data = res.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            text = data[0]["generated_text"]
        else:
            text = json.dumps(data)
        return LLMResponse(provider="huggingface", model=self.hf_model, text=text)


class SpeechFallbackService:
    """TTS: ElevenLabs -> Azure Speech -> browser fallback token."""

    def __init__(self) -> None:
        self.elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        self.azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.azure_speech_region = os.getenv("AZURE_SPEECH_REGION")

    def synthesize(self, text: str, voice_id: Optional[str] = None, language: str = "en-US") -> AudioResponse:
        errors = []
        for provider, fn in [
            ("elevenlabs", self._tts_elevenlabs),
            ("azure", self._tts_azure),
        ]:
            try:
                return fn(text, voice_id, language)
            except Exception as exc:
                logger.warning("TTS provider %s failed: %s", provider, exc)
                errors.append(f"{provider}: {exc}")

        return AudioResponse(
            provider="browser_fallback",
            mime_type="text/plain",
            audio_bytes=None,
            message="Use browser SpeechSynthesis fallback on client",
        )

    def _tts_elevenlabs(self, text: str, voice_id: Optional[str], _language: str) -> AudioResponse:
        if not self.elevenlabs_key:
            raise ProviderError("Missing ELEVENLABS_API_KEY")
        selected_voice = voice_id or os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
        endpoint = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice}?output_format=mp3_44100_128"
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.4,
                "use_speaker_boost": True,
            },
        }
        headers = {"xi-api-key": self.elevenlabs_key, "Content-Type": "application/json"}
        res = requests.post(endpoint, headers=headers, json=payload, timeout=45)
        res.raise_for_status()
        return AudioResponse(provider="elevenlabs", mime_type="audio/mpeg", audio_bytes=res.content)

    def _tts_azure(self, text: str, _voice_id: Optional[str], language: str) -> AudioResponse:
        if not self.azure_speech_key or not self.azure_speech_region:
            raise ProviderError("Missing AZURE_SPEECH_KEY / AZURE_SPEECH_REGION")

        endpoint = f"https://{self.azure_speech_region}.tts.speech.microsoft.com/cognitiveservices/v1"
        ssml = f"""
        <speak version='1.0' xml:lang='{language}'>
          <voice xml:lang='{language}' xml:gender='Female' name='en-US-JennyNeural'>
            {text}
          </voice>
        </speak>
        """.strip()
        headers = {
            "Ocp-Apim-Subscription-Key": self.azure_speech_key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        }
        res = requests.post(endpoint, headers=headers, data=ssml.encode("utf-8"), timeout=45)
        res.raise_for_status()
        return AudioResponse(provider="azure", mime_type="audio/mpeg", audio_bytes=res.content)


class STTFallbackService:
    """STT: Deepgram -> AssemblyAI -> Azure Speech."""

    def __init__(self) -> None:
        self.deepgram_key = os.getenv("DEEPGRAM_API_KEY")
        self.assembly_key = os.getenv("ASSEMBLYAI_API_KEY")
        self.azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.azure_speech_region = os.getenv("AZURE_SPEECH_REGION")

    def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/wav", language: str = "en-US") -> STTResponse:
        errors = []
        for provider, fn in [
            ("deepgram", self._stt_deepgram),
            ("assemblyai", self._stt_assemblyai),
            ("azure", self._stt_azure),
        ]:
            try:
                return fn(audio_bytes, mime_type, language)
            except Exception as exc:
                logger.warning("STT provider %s failed: %s", provider, exc)
                errors.append(f"{provider}: {exc}")

        raise ProviderError("All STT providers failed -> " + " | ".join(errors))

    def _stt_deepgram(self, audio_bytes: bytes, mime_type: str, _language: str) -> STTResponse:
        if not self.deepgram_key:
            raise ProviderError("Missing DEEPGRAM_API_KEY")
        endpoint = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
        headers = {
            "Authorization": f"Token {self.deepgram_key}",
            "Content-Type": mime_type,
        }
        res = requests.post(endpoint, headers=headers, data=audio_bytes, timeout=60)
        res.raise_for_status()
        data = res.json()
        alt = data["results"]["channels"][0]["alternatives"][0]
        return STTResponse(provider="deepgram", text=alt.get("transcript", "").strip(), confidence=alt.get("confidence"))

    def _stt_assemblyai(self, audio_bytes: bytes, _mime_type: str, _language: str) -> STTResponse:
        if not self.assembly_key:
            raise ProviderError("Missing ASSEMBLYAI_API_KEY")

        headers = {"authorization": self.assembly_key}
        upload_res = requests.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            data=audio_bytes,
            timeout=60,
        )
        upload_res.raise_for_status()
        audio_url = upload_res.json()["upload_url"]

        transcript_res = requests.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={**headers, "content-type": "application/json"},
            json={"audio_url": audio_url},
            timeout=30,
        )
        transcript_res.raise_for_status()
        transcript_id = transcript_res.json()["id"]

        for _ in range(30):
            poll = requests.get(f"https://api.assemblyai.com/v2/transcript/{transcript_id}", headers=headers, timeout=20)
            poll.raise_for_status()
            body = poll.json()
            status = body.get("status")
            if status == "completed":
                return STTResponse(provider="assemblyai", text=body.get("text", "").strip(), confidence=None)
            if status == "error":
                raise ProviderError(body.get("error", "AssemblyAI transcript error"))
            time.sleep(2)

        raise ProviderError("AssemblyAI timeout")

    def _stt_azure(self, audio_bytes: bytes, _mime_type: str, language: str) -> STTResponse:
        if not self.azure_speech_key or not self.azure_speech_region:
            raise ProviderError("Missing AZURE_SPEECH_KEY / AZURE_SPEECH_REGION")
        endpoint = (
            f"https://{self.azure_speech_region}.stt.speech.microsoft.com/"
            f"speech/recognition/conversation/cognitiveservices/v1?language={language}"
        )
        headers = {
            "Ocp-Apim-Subscription-Key": self.azure_speech_key,
            "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        }
        res = requests.post(endpoint, headers=headers, data=audio_bytes, timeout=60)
        res.raise_for_status()
        body = res.json()
        return STTResponse(provider="azure", text=body.get("DisplayText", "").strip(), confidence=None)


def extract_json_object(text: str) -> Dict[str, Any]:
    """Safely parse model output that should contain JSON."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in model output")
    return json.loads(match.group(0))


def b64encode_bytes(raw: Optional[bytes]) -> Optional[str]:
    if raw is None:
        return None
    return base64.b64encode(raw).decode("utf-8")


def b64decode_audio(payload: str) -> bytes:
    return base64.b64decode(payload)
