import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def check_complaint(new_complaint: str, history: list) -> dict:
    """Check if complaint is a duplicate using Groq LLaMA 3.1 8B (fast, classification task)."""

    system_prompt = """You are a support assistant for a civic services system.
Compare the 'New Complaint' against the 'Existing List'.
If the 'New Complaint' is semantically the same as one in the list, it is a duplicate.

Return ONLY a valid JSON object with these keys:
- "is_duplicate": boolean (true if duplicate, false otherwise)
- "result": string ("already there" if duplicate, "not done" if new)

Do NOT include markdown, backticks, or any text outside the JSON."""

    user_message = f"""Existing List: {json.dumps(history)}
New Complaint: "{new_complaint}" """

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 128,
                    "response_format": {"type": "json_object"},
                },
            )

        if resp.status_code != 200:
            print(f"Groq API error: {resp.status_code} - {resp.text}")
            return {"is_duplicate": False, "result": "not done"}

        result = resp.json()
        content = result["choices"][0]["message"]["content"]
        return json.loads(content)

    except Exception as e:
        print(f"SimilarComplaint Error: {e}")
        return {"is_duplicate": False, "result": "not done"}
