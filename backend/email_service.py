import os
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_PATH, override=True)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL") or "onboarding@resend.dev"

print("ENV LOADED FROM:", ENV_PATH)
print("RESEND_API_KEY exists:", bool(RESEND_API_KEY))
print("FROM_EMAIL:", FROM_EMAIL)


def send_otp_email(to_email, otp):
    try:
        if not RESEND_API_KEY:
            print("ERROR: RESEND_API_KEY missing")
            return False

        payload = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Your OTP Code",
            "html": f"""
                <div style="font-family: Arial, sans-serif;">
                    <h2>Secure Gateway OTP</h2>
                    <p>Your OTP is:</p>
                    <h1 style="color:#2563eb;">{otp}</h1>
                    <p>This OTP is valid for 5 minutes.</p>
                </div>
            """,
        }

        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )

        print("Resend status:", response.status_code)
        print("Resend response:", response.text)

        return response.status_code in (200, 202)

    except Exception as e:
        print("Exception while sending OTP:", str(e))
        return False