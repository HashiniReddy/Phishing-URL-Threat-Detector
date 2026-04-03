import os
import bcrypt
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from database import db
from models import User, OTPCode

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///auth.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "default-secret-key")

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "Backend is running"
    })


@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()

        full_name = data.get("full_name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()

        if not full_name or not email or not password:
            return jsonify({
                "status": "error",
                "message": "All fields are required"
            }), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                "status": "error",
                "message": "Email already registered"
            }), 400

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=hashed_password,
            is_verified=False
        )

        db.session.add(new_user)
        db.session.commit()

        OTPCode.query.filter_by(email=email).delete()
        db.session.commit()

        otp = str(random.randint(100000, 999999))
        expiry_time = datetime.utcnow() + timedelta(minutes=5)

        otp_entry = OTPCode(
            email=email,
            otp_code=otp,
            expires_at=expiry_time,
            used=False
        )

        db.session.add(otp_entry)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "User registered. OTP generated successfully",
            "email": email,
            "otp_for_testing": otp
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()

        email = data.get("email", "").strip().lower()
        otp = data.get("otp", "").strip()

        if not email or not otp:
            return jsonify({
                "status": "error",
                "message": "Email and OTP are required"
            }), 400

        otp_record = OTPCode.query.filter_by(
            email=email,
            otp_code=otp,
            used=False
        ).order_by(OTPCode.created_at.desc()).first()

        if not otp_record:
            return jsonify({
                "status": "error",
                "message": "Invalid OTP"
            }), 400

        if datetime.utcnow() > otp_record.expires_at:
            return jsonify({
                "status": "error",
                "message": "OTP has expired"
            }), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        user.is_verified = True
        otp_record.used = True
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "OTP verified successfully. Account activated."
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        if not user.is_verified:
            return jsonify({
                "status": "error",
                "message": "Please verify your email before logging in"
            }), 403

        password_matches = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8")
        )

        if not password_matches:
            return jsonify({
                "status": "error",
                "message": "Invalid password"
            }), 401

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "full_name": user.full_name,
                "email": user.email
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)