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
from scoring import (
    convert_inputs_to_features,
    get_risk,
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
# โหลด model
model = joblib.load("model.pkl")

# สร้าง client สำหรับ Qwen
client = OpenAI(
    api_key="sk-sp-601cd068acc64f64bfced0eb509d04d4",
    base_url="https://coding-intl.dashscope.aliyuncs.com/v1"
)

class BusinessInput(BaseModel):
    business_type: str
    country: str
    city: str
    budget: float
    target_customer: str
    competitor_level: str


def convert_inputs_to_features(data):
    def demo(x):
        return {
            "students": 80,
            "families": 65,
            "young professionals": 75,
            "tourists": 70
        }.get(x.lower(), 50)

    def trend(x):
        return {
            "coffee shop": 75,
            "restaurant": 72,
            "bubble tea": 78,
            "fashion": 70
        }.get(x.lower(), 50)

    def macro(x):
        return {
            "thailand": 72,
            "vietnam": 80,
            "indonesia": 78,
            "singapore": 68
        }.get(x.lower(), 50)

    def comp(x):
        return {
            "low": 85,
            "medium": 65,
            "high": 40
        }.get(x.lower(), 50)

    def loc(x):
        return {
            "tier1": 85,
            "tier2": 70,
            "tier3": 55
        }.get(x.lower(), 60)


    def fin(b):
        if b >= 10000:
            return 85
        elif b >= 5000:
            return 70
        elif b >= 2000:
            return 55
        else:
            return 35

    return {
        "demographic": demo(data["target_customer"]),
        "trend": trend(data["business_type"]),
        "macro": macro(data["country"]),
        "competition": comp(data["competitor_level"]),
        "location": loc(data["city"]),
        "financial": fin(data["budget"])
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
    response = client.chat.completions.create(
        model="qwen3.6-plus",
        messages=[
            {"role": "system", "content": "You are a clear and practical SME investment analyst."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5
    )

    text = response.choices[0].message.content

    try:
        return json.loads(text)
    except:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {
            "message": text,
            "summary": "Parsing failed"
        }


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

    prompt = build_qwen_prompt(d, features, score, risk)
    qwen_result = ask_qwen(prompt)

    breakdown = {
        "Demographic Fit": features["demographic"],
        "Trend Momentum": features["trend"],
        "Macro Stability": features["macro"],
        "Competition Score": features["competition"],
        "Location Potential": features["location"],
        "Financial Readiness": features["financial"]
    }

return {
    "score": score,
    "risk": risk,
    "summary": qwen_result.get("summary", ""),
    "message": qwen_result.get("message", ""),
    "features": {
        "demographic": features["demographic"],
        "trend": features["trend"],
        "macro": features["macro"],
        "competition": features["competition"],
        "location": features["location"],
        "financial": features["financial"]
    }
}