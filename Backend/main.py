from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv
import joblib
import numpy as np
import re
import requests

from scoring import (
    build_strengths,
    build_risks,
    build_recommendations,
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model.pkl")

client = OpenAI(
    api_key="sk-sp-601cd068acc64f64bfced0eb509d04d4",
    base_url="https://coding-intl.dashscope.aliyuncs.com/v1"
)
SERPAPI_KEY = os.getenv("SERPAPI_KEY")


class BusinessInput(BaseModel):
    business_type: str
    country: str
    city: str
    budget: float
    target_customer: str
    competitor_level: str


def get_country_code(country_name: str) -> str:
    mapping = {
        "thailand": "THA",
        "vietnam": "VNM",
        "indonesia": "IDN",
        "singapore": "SGP"
    }
    return mapping.get(country_name.strip().lower(), "")


def get_country_short_code(country_name: str) -> str:
    mapping = {
        "thailand": "TH",
        "vietnam": "VN",
        "indonesia": "ID",
        "singapore": "SG"
    }
    return mapping.get(country_name.strip().lower(), "US")


def fetch_gdp_growth(country_name: str) -> float:
    fallback = {
        "thailand": 2.5,
        "vietnam": 5.0,
        "indonesia": 4.8,
        "singapore": 2.0
    }

    country_code = get_country_code(country_name)
    if not country_code:
        return fallback.get(country_name.strip().lower(), 2.0)

    url = f"https://api.worldbank.org/v2/country/{country_code}/indicator/NY.GDP.MKTP.KD.ZG?format=json"

    try:
        response = requests.get(url, timeout=8)
        response.raise_for_status()
        data = response.json()

        if len(data) < 2 or not isinstance(data[1], list):
            return fallback.get(country_name.strip().lower(), 2.0)

        for item in data[1]:
            if item.get("value") is not None:
                return float(item["value"])

        return fallback.get(country_name.strip().lower(), 2.0)
    except Exception as e:
        print("GDP API error:", e)
        return fallback.get(country_name.strip().lower(), 2.0)


def convert_gdp_to_macro_score(gdp_growth: float) -> float:
    if gdp_growth >= 7:
        return 85
    elif gdp_growth >= 5:
        return 75
    elif gdp_growth >= 3:
        return 65
    elif gdp_growth >= 1:
        return 55
    else:
        return 45


def fetch_serpapi_trend_score(business_type: str, country_name: str) -> float:
    fallback = {
        "coffee shop": 75,
        "restaurant": 72,
        "bubble tea": 78,
        "fashion": 70
    }

    if not SERPAPI_KEY:
        return fallback.get(str(business_type).lower(), 50)

    query_map = {
        "coffee shop": "coffee shop",
        "restaurant": "restaurant business",
        "bubble tea": "bubble tea",
        "fashion": "fashion retail"
    }

    query = query_map.get(str(business_type).lower(), str(business_type))
    geo = get_country_short_code(country_name)

    params = {
        "engine": "google_trends",
        "q": query,
        "data_type": "TIMESERIES",
        "geo": geo,
        "api_key": SERPAPI_KEY
    }

    try:
        response = requests.get("https://serpapi.com/search", params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        timeline = data.get("interest_over_time", {}).get("timeline_data", [])
        values = []

        for item in timeline:
            series = item.get("values", [])
            for point in series:
                extracted = point.get("extracted_value")
                if extracted is not None:
                    values.append(float(extracted))

        if values:
            avg_interest = sum(values) / len(values)

            # normalize to your scoring style
            if avg_interest >= 80:
                return 85
            elif avg_interest >= 60:
                return 75
            elif avg_interest >= 40:
                return 65
            elif avg_interest >= 20:
                return 55
            else:
                return 45

        return fallback.get(str(business_type).lower(), 50)
    except Exception as e:
        print("SerpAPI trend error:", e)
        return fallback.get(str(business_type).lower(), 50)


def convert_inputs_to_features(data):
    def demo(x):
        return {
            "students": 80,
            "families": 65,
            "young professionals": 75,
            "tourists": 70
        }.get(str(x).lower(), 50)

    def comp(x):
        return {
            "low": 85,
            "medium": 65,
            "high": 40
        }.get(str(x).lower(), 50)

    def loc(x):
        return {
            "tier1": 85,
            "tier2": 70,
            "tier3": 55
        }.get(str(x).lower(), 60)

    def fin(b):
        try:
            b = float(b)
        except Exception:
            b = 0

        if b >= 10000:
            return 85
        elif b >= 5000:
            return 70
        elif b >= 2000:
            return 55
        else:
            return 35

    gdp_growth = fetch_gdp_growth(data["country"])
    macro_score = convert_gdp_to_macro_score(gdp_growth)
    trend_score = fetch_serpapi_trend_score(data["business_type"], data["country"])

    return {
        "demographic": demo(data["target_customer"]),
        "trend": trend_score,
        "macro": macro_score,
        "competition": comp(data["competitor_level"]),
        "location": loc(data["city"]),
        "financial": fin(data["budget"]),
        "gdp_growth": gdp_growth
    }


def get_risk(score):
    if score >= 75:
        return "Low"
    elif score >= 55:
        return "Medium"
    else:
        return "High"


def build_qwen_prompt(user_data, features, score, risk):
    return f"""
You are Synthiq AI, a business investment consultant.

Respond in a short, clear, and easy-to-read format.
Use simple language.
Use short sections and bullet points.
Do not write long paragraphs.
Do not change the score.

User Input:
- Business Type: {user_data["business_type"]}
- Country: {user_data["country"]}
- City: {user_data["city"]}
- Budget: ${user_data["budget"]} USD
- Target Customer: {user_data["target_customer"]}
- Competition Level: {user_data["competitor_level"]}

Computed Features:
- Demographic Score: {features["demographic"]}
- Trend Score: {features["trend"]}
- Macro Score: {features["macro"]}
- GDP Growth: {features.get("gdp_growth", 0.0)}%
- Competition Score: {features["competition"]}
- Location Score: {features["location"]}
- Financial Score: {features["financial"]}

Final Computed Result:
- Investment Score: {score}
- Risk Grade: {risk}

Return ONLY JSON:
{{
  "message": "📊 Investment Score: {score} ({risk})\\n\\n💡 Overview:\\n- ...\\n\\n✅ Strengths:\\n- ...\\n- ...\\n\\n⚠ Risks:\\n- ...\\n- ...\\n\\n🚀 Recommendations:\\n- ...\\n- ...\\n- ...",
  "summary": "Short 1-2 sentence summary."
}}
"""


def ask_qwen(prompt: str):
    if client is None:
        return {
            "message": "AI unavailable, using fallback analysis.",
            "summary": "AI disabled"
        }

    response = client.chat.completions.create(
        model="qwen3.6-plus",
        messages=[
            {"role": "system", "content": "You are a clear and practical SME investment analyst."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=220
    )

    text = response.choices[0].message.content

    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass

        return {
            "message": text,
            "summary": "Parsing failed"
        }


def build_fast_message(score, risk, strengths, risks, recommendations):
    strengths_text = "\n".join([f"- 🎯 {item}" for item in strengths[:3]])
    risks_text = "\n".join([f"- ⚠️ {item}" for item in risks[:3]])
    recommendations_text = "\n".join([f"- 🚀 {item}" for item in recommendations[:3]])

    return f"""📊 Investment Score: {score} ({risk})

💡 Overview:
- This business idea has been evaluated using market demand, competition, financial readiness, and macroeconomic signals.
- It shows {risk.lower()} risk with opportunities depending on execution quality.

✅ Strengths:
{strengths_text}

⚠ Risks:
{risks_text}

🚀 Recommendations:
{recommendations_text}

🧠 Summary:
- This business has {risk.lower()} risk and requires smart strategy to succeed."""


@app.get("/")
def root():
    return {"message": "Synthiq backend is running"}


@app.post("/analyze")
def analyze(data: BusinessInput):
    d = data.dict()

    features = convert_inputs_to_features(d)

    model_input = np.array([[
        features["demographic"],
        features["trend"],
        features["macro"],
        features["competition"],
        features["location"],
        features["financial"]
    ]])

    score = float(model.predict(model_input)[0])
    score = round(score, 2)

    risk = get_risk(score)

    strengths = build_strengths(d, features)
    risks = build_risks(d, features)
    recommendations = build_recommendations(d, features)

    fast_message = build_fast_message(score, risk, strengths, risks, recommendations)
    summary = "Business analysis generated successfully."

    try:
        prompt = build_qwen_prompt(d, features, score, risk)
        qwen_result = ask_qwen(prompt)
        message = qwen_result.get("message", fast_message)
        summary = qwen_result.get("summary", summary)
    except Exception as e:
        print("Qwen error:", e)
        message = fast_message

    return {
        "score": score,
        "risk": risk,
        "features": {
            "demographic": features["demographic"],
            "trend": features["trend"],
            "macro": features["macro"],
            "competition": features["competition"],
            "location": features["location"],
            "financial": features["financial"]
        },
        "macro_data": {
            "gdp_growth": features.get("gdp_growth", 0.0)
        },
        "strengths": strengths,
        "risks": risks,
        "recommendations": recommendations,
        "message": message,
        "summary": summary
    }