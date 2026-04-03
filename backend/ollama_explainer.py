import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "phi"


def get_ai_explanation(url, ml_result, final_verdict, final_score, reasons):
    prompt = f"""
You are a cybersecurity assistant.

Explain this URL scan result in simple words for a college project demo.

URL: {url}
Final Verdict: {final_verdict}
Final Score: {final_score}
ML Prediction: {ml_result.get("verdict")}
ML Confidence: {ml_result.get("confidence")}
Reasons: {reasons}

Rules:
1. The explanation must match the Final Verdict exactly.
2. If Final Verdict is Suspicious, do not call it Malicious.
3. Keep it short in 3 to 4 lines.
4. Use simple English.
5. End with a short safety suggestion.
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "stream": False
            },
            timeout=60
        )

        if response.status_code != 200:
            return f"Ollama request failed: {response.text}"

        data = response.json()
        return data.get("message", {}).get("content", "").strip() or "No explanation generated."

    except Exception as e:
        return f"Ollama error: {str(e)}"