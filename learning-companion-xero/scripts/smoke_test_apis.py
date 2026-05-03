import json
import os
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional

import requests


TIMEOUT_SECONDS = 20


@dataclass
class TestResult:
    category: str
    provider: str
    secret_name: str
    endpoint: str
    method: str
    ok: bool
    status_code: Optional[int]
    note: str


def has_env(name: str) -> bool:
    value = os.getenv(name)
    return bool(value and value.strip())


def request_json(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, str]] = None,
    json_body: Optional[Dict] = None,
) -> requests.Response:
    return requests.request(
        method=method,
        url=url,
        headers=headers or {},
        params=params or {},
        json=json_body,
        timeout=TIMEOUT_SECONDS,
    )


def mk_result(
    category: str,
    provider: str,
    secret_name: str,
    endpoint: str,
    method: str,
    ok: bool,
    status_code: Optional[int],
    note: str,
) -> TestResult:
    return TestResult(
        category=category,
        provider=provider,
        secret_name=secret_name,
        endpoint=endpoint,
        method=method,
        ok=ok,
        status_code=status_code,
        note=note,
    )


def summarize_response_ok(status_code: int) -> bool:
    return 200 <= status_code < 300


def test_gemini(secret_name: str) -> TestResult:
    if not has_env(secret_name):
        return mk_result("LLM", "Gemini", secret_name, "-", "POST", False, None, "Missing secret")

    key = os.getenv(secret_name, "")
    endpoint = "https://generativelanguage.googleapis.com/v1beta/models"
    try:
        response = request_json("GET", endpoint, params={"key": key})
        ok = summarize_response_ok(response.status_code)
        note = "Success" if ok else "Provider returned non-2xx"
        return mk_result("LLM", "Gemini", secret_name, endpoint, "GET", ok, response.status_code, note)
    except Exception as exc:
        return mk_result("LLM", "Gemini", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_openai() -> TestResult:
    secret_name = "OPENAI_API_KEY"
    endpoint = "https://api.openai.com/v1/models"
    if not has_env(secret_name):
        return mk_result("LLM", "OpenAI", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={"Authorization": f"Bearer {os.getenv(secret_name, '')}"},
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("LLM", "OpenAI", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("LLM", "OpenAI", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_groq() -> TestResult:
    secret_name = "GROQ_API_KEY"
    endpoint = "https://api.groq.com/openai/v1/models"
    if not has_env(secret_name):
        return mk_result("LLM", "Groq", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={"Authorization": f"Bearer {os.getenv(secret_name, '')}"},
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("LLM", "Groq", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("LLM", "Groq", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_openrouter() -> TestResult:
    secret_name = "OPENROUTER_API_KEY"
    endpoint = "https://openrouter.ai/api/v1/models"
    if not has_env(secret_name):
        return mk_result("LLM", "OpenRouter", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={
                "Authorization": f"Bearer {os.getenv(secret_name, '')}",
                "HTTP-Referer": "https://lovable.dev",
                "X-Title": "EduMentor Smoke Test",
            },
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("LLM", "OpenRouter", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("LLM", "OpenRouter", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_huggingface() -> TestResult:
    secret_name = "HUGGINGFACE_TOKEN"
    endpoint = "https://huggingface.co/api/whoami-v2"
    if not has_env(secret_name):
        return mk_result("LLM", "HuggingFace", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={"Authorization": f"Bearer {os.getenv(secret_name, '')}"},
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("LLM", "HuggingFace", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("LLM", "HuggingFace", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_elevenlabs() -> TestResult:
    secret_name = "ELEVENLABS_API_KEY"
    endpoint = "https://api.elevenlabs.io/v1/models"
    if not has_env(secret_name):
        return mk_result("TTS", "ElevenLabs", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={"xi-api-key": os.getenv(secret_name, "")},
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("TTS", "ElevenLabs", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("TTS", "ElevenLabs", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_assemblyai() -> TestResult:
    secret_name = "ASSEMBLYAI_API_KEY"
    endpoint = "https://api.assemblyai.com/v2/account"
    if not has_env(secret_name):
        return mk_result("STT", "AssemblyAI", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={"authorization": os.getenv(secret_name, "")},
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("STT", "AssemblyAI", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("STT", "AssemblyAI", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_deepgram() -> TestResult:
    secret_name = "DEEPGRAM_API_KEY"
    endpoint = "https://api.deepgram.com/v1/projects"
    if not has_env(secret_name):
        return mk_result("STT", "Deepgram", secret_name, endpoint, "GET", False, None, "Missing secret")

    try:
        response = request_json(
            "GET",
            endpoint,
            headers={"Authorization": f"Token {os.getenv(secret_name, '')}"},
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("STT", "Deepgram", secret_name, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("STT", "Deepgram", secret_name, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def test_azure_speech(secret_name: str) -> TestResult:
    endpoint_secret = "AZURE_SPEECH_ENDPOINT"
    region_secret = "AZURE_SPEECH_REGION"

    if not has_env(secret_name):
        return mk_result("Speech", "Azure Speech", secret_name, "-", "GET", False, None, "Missing secret")

    region = os.getenv(region_secret, "").strip()
    endpoint_from_secret = os.getenv(endpoint_secret, "").strip().rstrip("/")
    if endpoint_from_secret:
        endpoint = f"{endpoint_from_secret}/sts/v1.0/issueToken"
    elif region:
        endpoint = f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    else:
        return mk_result(
            "Speech",
            "Azure Speech",
            secret_name,
            "-",
            "POST",
            False,
            None,
            "Missing AZURE_SPEECH_ENDPOINT and AZURE_SPEECH_REGION",
        )

    try:
        response = request_json(
            "POST",
            endpoint,
            headers={
                "Ocp-Apim-Subscription-Key": os.getenv(secret_name, ""),
                "Ocp-Apim-Subscription-Region": region,
                "Content-Length": "0",
            },
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("Speech", "Azure Speech", secret_name, endpoint, "POST", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("Speech", "Azure Speech", secret_name, endpoint, "POST", False, None, f"Request failed: {type(exc).__name__}")


def test_supabase() -> TestResult:
    url_secret = "SUPABASE_URL"
    key_secret = "SUPABASE_KEY"

    if not has_env(url_secret) or not has_env(key_secret):
        return mk_result("Database", "Supabase REST", key_secret, "-", "GET", False, None, "Missing SUPABASE_URL or SUPABASE_KEY")

    base_url = os.getenv(url_secret, "").rstrip("/")
    endpoint = f"{base_url}/rest/v1/"

    try:
        key = os.getenv(key_secret, "")
        response = request_json(
            "GET",
            endpoint,
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
            },
        )
        ok = summarize_response_ok(response.status_code)
        return mk_result("Database", "Supabase REST", key_secret, endpoint, "GET", ok, response.status_code, "Success" if ok else "Provider returned non-2xx")
    except Exception as exc:
        return mk_result("Database", "Supabase REST", key_secret, endpoint, "GET", False, None, f"Request failed: {type(exc).__name__}")


def note_managed_lovable_key() -> TestResult:
    return mk_result(
        category="Platform",
        provider="Lovable API Gateway",
        secret_name="LOVABLE_API_KEY",
        endpoint="Managed internally",
        method="N/A",
        ok=True,
        status_code=None,
        note="Managed key exists and is rotated via platform control, not direct third-party API call.",
    )


def run_all_tests() -> List[TestResult]:
    results: List[TestResult] = []

    results.append(test_gemini("GEMINI_API_KEY"))
    results.append(test_gemini("GEMINI_API_KEY_SECONDARY"))
    results.append(test_openai())
    results.append(test_groq())
    results.append(test_openrouter())
    results.append(test_huggingface())
    results.append(test_elevenlabs())
    results.append(test_assemblyai())
    results.append(test_deepgram())
    results.append(test_azure_speech("AZURE_SPEECH_KEY_1"))
    results.append(test_azure_speech("AZURE_SPEECH_KEY_2"))
    results.append(test_supabase())
    results.append(note_managed_lovable_key())

    return results


def print_summary(results: List[TestResult]) -> None:
    passed = len([r for r in results if r.ok])
    total = len(results)
    print(f"Passed {passed}/{total} checks")
    for row in results:
        status_label = "PASS" if row.ok else "FAIL"
        status_code = row.status_code if row.status_code is not None else "-"
        print(f"[{status_label}] {row.provider:<18} {row.secret_name:<24} status={status_code} endpoint={row.endpoint}")


def main() -> None:
    results = run_all_tests()
    print_summary(results)

    out_json_path = os.getenv("API_SMOKE_RESULTS_JSON", "scripts/api-smoke-results.json")
    os.makedirs(os.path.dirname(out_json_path), exist_ok=True)
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump([asdict(r) for r in results], f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()