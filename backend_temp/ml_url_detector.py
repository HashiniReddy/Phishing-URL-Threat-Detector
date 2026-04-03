import re
import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "url_model.pkl")

model = None


def load_model():
    global model
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
        model = joblib.load(MODEL_PATH)
    return model


def extract_features(url):
    url = str(url).strip().lower()

    return {
        "url_length": len(url),
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "has_https": 1 if url.startswith("https://") else 0,
        "has_ip": 1 if re.search(r"\d+\.\d+\.\d+\.\d+", url) else 0,
        "has_at": 1 if "@" in url else 0,
        "has_login": 1 if "login" in url else 0,
        "has_verify": 1 if "verify" in url else 0,
        "has_secure": 1 if "secure" in url else 0,
        "has_bank": 1 if "bank" in url else 0,
        "num_slashes": url.count("/"),
        "num_digits": sum(c.isdigit() for c in url)
    }


def predict_url_ml(url):
    if not url or not str(url).strip():
        return {
            "verdict": "Error",
            "confidence": 0,
            "safe_probability": 0,
            "malicious_probability": 0,
            "features": {},
            "reasons": [],
            "message": "URL is required"
        }

    try:
        loaded_model = load_model()
        features = extract_features(url)
        X = pd.DataFrame([features])

        prediction = int(loaded_model.predict(X)[0])

        safe_prob = 0.0
        malicious_prob = 0.0

        if hasattr(loaded_model, "predict_proba"):
            probability = loaded_model.predict_proba(X)[0]
            safe_prob = float(probability[0]) * 100
            malicious_prob = float(probability[1]) * 100
        else:
            if prediction == 1:
                malicious_prob = 100.0
                safe_prob = 0.0
            else:
                safe_prob = 100.0
                malicious_prob = 0.0

        if malicious_prob >= 80:
            verdict = "Malicious"
        elif malicious_prob >= 50:
            verdict = "Suspicious"
        else:
            verdict = "Safe"

        reasons = []
        if features["has_ip"]:
            reasons.append("Uses IP address instead of domain")
        if not features["has_https"]:
            reasons.append("Uses HTTP instead of HTTPS")
        if features["has_login"]:
            reasons.append("Contains suspicious keyword: login")
        if features["has_verify"]:
            reasons.append("Contains suspicious keyword: verify")
        if features["has_secure"]:
            reasons.append("Contains suspicious keyword: secure")
        if features["has_bank"]:
            reasons.append("Contains suspicious keyword: bank")
        if features["has_at"]:
            reasons.append("Contains @ symbol in URL")

        if not reasons:
            reasons.append("No major suspicious patterns detected")

        return {
            "prediction": prediction,
            "verdict": verdict,
            "confidence": round(max(safe_prob, malicious_prob), 2),
            "safe_probability": round(safe_prob, 2),
            "malicious_probability": round(malicious_prob, 2),
            "features": features,
            "reasons": reasons
        }

    except Exception as e:
        return {
            "verdict": "Error",
            "confidence": 0,
            "safe_probability": 0,
            "malicious_probability": 0,
            "features": {},
            "reasons": [],
            "message": str(e)
        }