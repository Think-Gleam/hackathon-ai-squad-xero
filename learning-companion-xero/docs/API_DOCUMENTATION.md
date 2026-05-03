# EduMentor API Smoke Test Documentation

This project includes live smoke testing for all configured secrets via:

- **Code file:** `scripts/smoke_test_apis.py`
- **Latest machine-readable output:** `scripts/api-smoke-results.json`

## What was tested

All listed secret categories were called with real HTTP requests (without exposing secret values).

| Category | Provider | Secret(s) Used | Endpoint Called | Method | Auth Header/Style |
|---|---|---|---|---|---|
| LLM | Gemini | `GEMINI_API_KEY`, `GEMINI_API_KEY_SECONDARY` | `https://generativelanguage.googleapis.com/v1beta/models` | GET | `?key=<API_KEY>` query param |
| LLM | OpenAI | `OPENAI_API_KEY` | `https://api.openai.com/v1/models` | GET | `Authorization: Bearer <key>` |
| LLM | Groq | `GROQ_API_KEY` | `https://api.groq.com/openai/v1/models` | GET | `Authorization: Bearer <key>` |
| LLM | OpenRouter | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1/models` | GET | `Authorization: Bearer <key>` (+ referer/title headers) |
| LLM | HuggingFace | `HUGGINGFACE_TOKEN` | `https://huggingface.co/api/whoami-v2` | GET | `Authorization: Bearer <token>` |
| TTS | ElevenLabs | `ELEVENLABS_API_KEY` | `https://api.elevenlabs.io/v1/models` | GET | `xi-api-key: <key>` |
| STT | AssemblyAI | `ASSEMBLYAI_API_KEY` | `https://api.assemblyai.com/v2/account` | GET | `authorization: <key>` |
| STT | Deepgram | `DEEPGRAM_API_KEY` | `https://api.deepgram.com/v1/projects` | GET | `Authorization: Token <key>` |
| Speech | Azure Speech | `AZURE_SPEECH_KEY_1`, `AZURE_SPEECH_KEY_2`, `AZURE_SPEECH_REGION`/`AZURE_SPEECH_ENDPOINT` | `https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken` | POST | `Ocp-Apim-Subscription-Key`, `Ocp-Apim-Subscription-Region` |
| Database | Supabase REST | `SUPABASE_URL`, `SUPABASE_KEY` | `{SUPABASE_URL}/rest/v1/` | GET | `apikey`, `Authorization: Bearer <key>` |
| Platform | Lovable API Gateway | `LOVABLE_API_KEY` | Managed internally | N/A | Managed by platform |

## Current verification summary

From latest run:

- **Passed:** 12/13 checks
- **Failed:** Supabase REST check returned **401 Unauthorized**

### Notes on failures

- **Supabase 401** typically means the key is invalid for PostgREST access, wrong project URL/key pairing, or restricted key type.

## How to re-run

```bash
python3 /dev-server/scripts/smoke_test_apis.py
```

The script rewrites `scripts/api-smoke-results.json` on each run.