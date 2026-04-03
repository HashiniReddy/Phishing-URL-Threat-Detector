import re


def extract_features(url):
    features = {}

    features["url_length"] = len(url)
    features["has_ip"] = 1 if re.search(r"\d+\.\d+\.\d+\.\d+", url) else 0
    features["num_dots"] = url.count(".")
    features["num_hyphens"] = url.count("-")
    features["has_https"] = 1 if url.startswith("https://") else 0

    suspicious_words = [
        "login", "verify", "bank", "secure",
        "free", "gift", "update", "account",
        "signin", "wallet"
    ]
    features["has_suspicious_words"] = 1 if any(word in url.lower() for word in suspicious_words) else 0
    features["has_at_symbol"] = 1 if "@" in url else 0

    return features


def detect_url(url):
    features = extract_features(url)
    score = 0

    if features["url_length"] > 75:
        score += 1
    if features["has_ip"]:
        score += 2
    if features["num_dots"] > 3:
        score += 1
    if features["num_hyphens"] > 2:
        score += 1
    if not features["has_https"]:
        score += 1
    if features["has_suspicious_words"]:
        score += 2
    if features["has_at_symbol"]:
        score += 2

    if score >= 5:
        return "Malicious"
    elif score >= 3:
        return "Suspicious"
    else:
        return "Safe"