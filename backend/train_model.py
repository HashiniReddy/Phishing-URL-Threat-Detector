import pandas as pd
import re
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "url_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "url_model.pkl")


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


df = pd.read_csv(DATASET_PATH)
df = df.dropna(subset=["url", "label"])
df["url"] = df["url"].astype(str)

print("Dataset size:", len(df))

feature_rows = df["url"].apply(extract_features)
X = pd.DataFrame(feature_rows.tolist())

feature_columns = [
    "url_length", "num_dots", "num_hyphens", "has_https",
    "has_ip", "has_at", "has_login", "has_verify",
    "has_secure", "has_bank", "num_slashes", "num_digits"
]
X = X[feature_columns]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("Train size:", len(X_train))
print("Test size:", len(X_test))

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

joblib.dump(model, MODEL_PATH)
print(f"\nModel saved at: {MODEL_PATH}")