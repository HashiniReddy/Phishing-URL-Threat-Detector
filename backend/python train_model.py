import re
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


def extract_features(url):
    return {
        "url_length": len(url),
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "has_https": 1 if url.startswith("https://") else 0,
        "has_ip": 1 if re.search(r"\d+\.\d+\.\d+\.\d+", url) else 0,
        "has_at": 1 if "@" in url else 0,
        "has_login": 1 if "login" in url.lower() else 0,
        "has_verify": 1 if "verify" in url.lower() else 0,
        "has_secure": 1 if "secure" in url.lower() else 0,
        "has_bank": 1 if "bank" in url.lower() else 0,
        "num_slashes": url.count("/"),
        "num_digits": sum(c.isdigit() for c in url)
    }


# load dataset
df = pd.read_csv("url_dataset.csv")

X = pd.DataFrame([extract_features(url) for url in df["url"]])
y = df["label"]

# split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# train model
model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

# accuracy
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))

# save model
joblib.dump(model, "url_model.pkl")
print("Model saved successfully")