from dotenv import load_dotenv
load_dotenv()

from ollama_explainer import get_ai_explanation
from ml_url_detector import predict_url_ml
from email_service import send_otp_email

import os
import bcrypt
import random
import re
import time
import requests
import dns.resolver
import jwt

from functools import wraps
from urllib.parse import urlparse
from datetime import datetime, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import db
from models import User, OTPCode, ScanHistory

# ----------------------------
# INIT
# ----------------------------

app = Flask(__name__)

CORS(app)

# ----------------------------
# CONFIG
# ----------------------------

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///auth.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "default-secret-key")
app.config["JWT_EXPIRES_HOURS"] = int(os.getenv("JWT_EXPIRES_HOURS", "24"))
app.config["OTP_EXPIRES_MINUTES"] = int(os.getenv("OTP_EXPIRES_MINUTES", "5"))

db.init_app(app)

with app.app_context():
    db.create_all()

VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
GSB_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")
NOVU_API_KEY = os.getenv("NOVU_API_KEY")

# ----------------------------
# HELPERS
# ----------------------------

def json_body():
    return request.get_json(silent=True) or {}

def success_response(message, status_code=200, **kwargs):
    payload = {"status": "success", "message": message}
    payload.update(kwargs)
    return jsonify(payload), status_code

def error_response(message, status_code=400, **kwargs):
    payload = {"status": "error", "message": message}
    payload.update(kwargs)
    return jsonify(payload), status_code

def normalize_email(email):
    return (email or "").strip().lower()

def validate_email(email):
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))

def validate_password(password):
    return len((password or "").strip()) >= 6

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password, password_hash):
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False

def generate_token(user):
    payload = {
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(hours=app.config["JWT_EXPIRES_HOURS"]),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return error_response("Token is missing or invalid", 401)

        token = auth_header.split(" ", 1)[1].strip()

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.filter_by(email=data["email"]).first()

            if not current_user:
                return error_response("User not found", 404)

        except jwt.ExpiredSignatureError:
            return error_response("Token has expired", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid token", 401)

        return f(current_user, *args, **kwargs)

    return decorated

def generate_otp():
    return str(random.randint(100000, 999999))

def store_new_otp(email):
    OTPCode.query.filter_by(email=email).delete()
    db.session.commit()

    otp = generate_otp()
    expiry_time = datetime.utcnow() + timedelta(minutes=app.config["OTP_EXPIRES_MINUTES"])

    otp_entry = OTPCode(
        email=email,
        otp_code=otp,
        expires_at=expiry_time,
        used=False
    )

    db.session.add(otp_entry)
    db.session.commit()

    return otp

def validate_url(url):
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False

def extract_basic_url_signals(url):
    reasons = []
    score = 0

    parsed = urlparse(url)
    hostname = parsed.netloc or ""

    suspicious_keywords = ["login", "verify", "secure", "account", "update", "bank", "signin", "confirm"]
    lower_url = url.lower()

    if parsed.scheme == "http":
        reasons.append("Uses HTTP instead of HTTPS")
        score += 10

    if re.fullmatch(r"(\d{1,3}\.){3}\d{1,3}", hostname.split(":")[0]):
        reasons.append("Uses IP address instead of domain")
        score += 15

    found_keywords = [kw for kw in suspicious_keywords if kw in lower_url]
    for kw in found_keywords:
        reasons.append(f"Contains suspicious keyword: {kw}")
        score += 8

    if len(url) > 75:
        reasons.append("URL is unusually long")
        score += 5

    if url.count(".") >= 4:
        reasons.append("URL contains many subdomains or dots")
        score += 5

    if "@" in url:
        reasons.append("URL contains @ symbol")
        score += 10

    if "-" in hostname:
        reasons.append("Domain contains hyphen")
        score += 3

    return {"reasons": reasons, "score": score}

def check_dns(hostname):
    try:
        dns.resolver.resolve(hostname, "A")
        return {"dns_resolves": True}
    except Exception:
        return {"dns_resolves": False}

def check_google_safe_browsing(url):
    if not GSB_API_KEY:
        return {"used": False, "match": None, "message": "Google Safe Browsing API key missing"}

    endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GSB_API_KEY}"
    payload = {
        "client": {
            "clientId": "secure-gateway-auth",
            "clientVersion": "1.0"
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}]
        }
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        return {
            "used": True,
            "match": bool(data.get("matches")),
            "raw": data
        }
    except Exception as e:
        return {"used": True, "match": None, "message": str(e)}

def check_virustotal(url):
    if not VT_API_KEY:
        return {"used": False, "message": "VirusTotal API key missing"}

    headers = {"x-apikey": VT_API_KEY}

    try:
        submit_resp = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            headers=headers,
            data={"url": url},
            timeout=15
        )
        submit_resp.raise_for_status()
        submit_data = submit_resp.json()

        analysis_id = submit_data.get("data", {}).get("id")
        if not analysis_id:
            return {"used": True, "message": "VirusTotal analysis ID not returned"}

        report_data = {}
        stats = {}
        final_status = "queued"

        for _ in range(3):
            report_resp = requests.get(
                f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                headers=headers,
                timeout=15
            )
            report_resp.raise_for_status()
            report_data = report_resp.json()

            attributes = report_data.get("data", {}).get("attributes", {})
            final_status = attributes.get("status", "queued")
            stats = attributes.get("stats", {})

            if final_status == "completed":
                break

            time.sleep(2)

        return {
            "used": True,
            "status": final_status,
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "harmless": stats.get("harmless", 0),
            "undetected": stats.get("undetected", 0),
            "raw": report_data
        }
    except Exception as e:
        return {"used": True, "message": str(e)}

def build_final_verdict(total_score, vt_result=None, gsb_result=None):
    if gsb_result and gsb_result.get("match") is True:
        return "Malicious"
    if vt_result and vt_result.get("malicious", 0) > 0:
        return "Malicious"
    if total_score >= 60:
        return "Malicious"
    if total_score >= 25:
        return "Suspicious"
    return "Safe"

def save_scan_history(current_user, url, verdict, score, reasons):
    try:
        scan = ScanHistory(
            user_email=current_user.email,
            url=url,
            verdict=verdict,
            score=score,
            reasons=" | ".join(reasons) if isinstance(reasons, list) else str(reasons)
        )
        db.session.add(scan)
        db.session.commit()
    except Exception:
        db.session.rollback()

def trigger_novu_security_alert(subscriber_id, title, body, severity, url, verdict):
    if not NOVU_API_KEY:
        print("NOVU_API_KEY missing")
        return False

    try:
        response = requests.post(
            "https://api.novu.co/v1/events/trigger",
            headers={
                "Authorization": f"ApiKey {NOVU_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "name": "security-alert",
                "to": {
                    "subscriberId": subscriber_id
                },
                "payload": {
                    "title": title,
                    "body": body,
                    "severity": severity,
                    "url": url,
                    "verdict": verdict
                }
            },
            timeout=20,
        )

        print("Novu status:", response.status_code)
        print("Novu body:", response.text)
        return response.status_code in (200, 201)
    except Exception as e:
        print("Novu trigger failed:", str(e))
        return False

# ----------------------------
# ROUTES
# ----------------------------

@app.route("/health", methods=["GET"])
def health():
    return success_response("Backend is running", 200)

@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = json_body()

        full_name = data.get("full_name", "").strip()
        email = normalize_email(data.get("email"))
        password = data.get("password", "").strip()

        if not full_name or not email or not password:
            return error_response("All fields are required", 400)

        if not validate_email(email):
            return error_response("Invalid email format", 400)

        if not validate_password(password):
            return error_response("Password must be at least 6 characters long", 400)

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            if existing_user.is_verified:
                return error_response("Email already registered", 400)

            otp = store_new_otp(email)
            send_otp_email(email, otp)
            return success_response("OTP sent again", 200, email=email)

        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            is_verified=False
        )

        db.session.add(new_user)
        db.session.commit()

        otp = store_new_otp(email)
        send_otp_email(email, otp)

        return success_response("User registered. OTP sent", 201, email=email)

    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@app.route("/login", methods=["POST"])
def login():
    try:
        data = json_body()
        email = normalize_email(data.get("email"))
        password = data.get("password", "").strip()

        if not email or not password:
            return error_response("Email and password are required", 400)

        user = User.query.filter_by(email=email).first()
        if not user:
            return error_response("Invalid credentials", 401)

        if not verify_password(password, user.password_hash):
            return error_response("Invalid credentials", 401)

        # If account is not verified yet, send OTP and ask user to verify
        if not user.is_verified:
            otp = store_new_otp(email)
            send_otp_email(email, otp)
            return error_response(
                "Email not verified. OTP sent again",
                403,
                email=email
            )

        # Verified user -> direct login, no OTP
        token = generate_token(user)
        return success_response(
            "Login successful",
            200,
            token=token,
            user={
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email
            }
        )

    except Exception as e:
        return error_response(str(e), 500)
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = json_body()
        email = normalize_email(data.get("email"))
        otp_code = str(data.get("otp", "")).strip()

        if not email or not otp_code:
            return error_response("Email and OTP are required", 400)

        otp_entry = OTPCode.query.filter_by(email=email, otp_code=otp_code, used=False).first()

        if not otp_entry:
            return error_response("Invalid OTP", 400)

        if otp_entry.expires_at < datetime.utcnow():
            return error_response("OTP has expired", 400)

        user = User.query.filter_by(email=email).first()
        if not user:
            return error_response("User not found", 404)

        user.is_verified = True
        otp_entry.used = True
        db.session.commit()

        token = generate_token(user)
        return success_response(
            "OTP verified successfully",
            200,
            token=token,
            user={
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email
            }
        )

    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = json_body()
        email = normalize_email(data.get("email"))

        if not email:
            return error_response("Email is required", 400)

        user = User.query.filter_by(email=email).first()
        if not user:
            return error_response("User not found", 404)

        if user.is_verified:
            return error_response("User is already verified", 400)

        otp = store_new_otp(email)
        send_otp_email(email, otp)

        return success_response("OTP resent successfully", 200, email=email)

    except Exception as e:
        return error_response(str(e), 500)

@app.route("/profile", methods=["GET"])
@token_required
def profile(current_user):
    return success_response(
        "Profile fetched successfully",
        200,
        user={
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "is_verified": current_user.is_verified
        }
    )

@app.route("/scan-url", methods=["POST"])
@token_required
def scan_url(current_user):
    try:
        data = json_body()
        url = (data.get("url") or "").strip()

        if not url:
            return error_response("URL is required", 400)

        if not validate_url(url):
            return error_response("Invalid URL format", 400)

        parsed = urlparse(url)
        hostname = (parsed.hostname or "").strip()

        basic = extract_basic_url_signals(url)
        reasons = list(basic["reasons"])
        total_score = basic["score"]

        dns_result = {"dns_resolves": None}
        if hostname:
            dns_result = check_dns(hostname)
            if dns_result.get("dns_resolves") is False:
                reasons.append("Domain does not resolve in DNS")
                total_score += 10

        ml_result = {}
        try:
            ml_result = predict_url_ml(url) or {}
            ml_prediction = str(
                ml_result.get("verdict")
                or ml_result.get("label")
                or ml_result.get("prediction")
                or ""
            ).lower()

            confidence = ml_result.get("confidence", 0)

            if "malicious" in ml_prediction or ml_prediction == "1":
                reasons.append(f"ML model predicted malicious with {confidence}% confidence")
                total_score += 25
            elif "suspicious" in ml_prediction:
                reasons.append(f"ML model predicted suspicious with {confidence}% confidence")
                total_score += 15
        except Exception as e:
            ml_result = {"error": str(e)}
            reasons.append("ML prediction unavailable")

        gsb_result = check_google_safe_browsing(url)
        if gsb_result.get("match") is True:
            reasons.append("Google Safe Browsing flagged this URL")
            total_score += 30
        elif gsb_result.get("match") is None and gsb_result.get("used"):
            reasons.append("Google Safe Browsing check unavailable")

        vt_result = check_virustotal(url)
        if vt_result.get("used"):
            vt_mal = vt_result.get("malicious", 0)
            vt_susp = vt_result.get("suspicious", 0)

            if vt_mal > 0:
                reasons.append(f"VirusTotal malicious detections: {vt_mal}")
                total_score += 20

            if vt_susp > 0:
                reasons.append(f"VirusTotal suspicious detections: {vt_susp}")
                total_score += 10

        verdict = build_final_verdict(
            total_score,
            vt_result=vt_result,
            gsb_result=gsb_result
        )

        print("Final verdict:", verdict)

        if verdict.lower() in ["malicious", "suspicious"]:
            print("Triggering Novu notification...")

            trigger_novu_security_alert(
                subscriber_id=current_user.email,
                title=f"{verdict} URL detected",
                body=f"The scanned URL {url} was classified as {verdict}.",
                severity=verdict.lower(),
                url=url,
                verdict=verdict,
            )

        explanation = None
        try:
            explanation = get_ai_explanation(url, {
                "verdict": verdict,
                "score": total_score,
                "reasons": reasons,
                "ml_result": ml_result,
                "virustotal": vt_result,
                "google_safe_browsing": gsb_result,
            })
        except Exception:
            explanation = None

        save_scan_history(current_user, url, verdict, total_score, reasons)

        return success_response(
            "Scan completed",
            200,
            url=url,
            verdict=verdict,
            score=total_score,
            reasons=reasons,
            ml_result=ml_result,
            dns_check=dns_result,
            google_safe_browsing=gsb_result,
            virustotal=vt_result,
            explanation=explanation
        )

    except Exception as e:
        return error_response(str(e), 500)

@app.route("/scan-history", methods=["GET"])
@token_required
def scan_history(current_user):
    try:
        scans = (
            ScanHistory.query
            .filter_by(user_email=current_user.email)
            .order_by(ScanHistory.id.desc())
            .all()
        )

        history = []
        for scan in scans:
            history.append({
                "id": scan.id,
                "url": scan.url,
                "verdict": scan.verdict,
                "score": scan.score,
                "reasons": scan.reasons,
                "created_at": scan.created_at.isoformat() if scan.created_at else None
            })

        return success_response("Scan history fetched successfully", 200, history=history)

    except Exception as e:
        return error_response(str(e), 500)

if __name__ == "__main__":
    app.run(debug=True)