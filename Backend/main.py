from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key="sk-sp-601cd068acc64f64bfced0eb509d04d4",
    base_url="https://coding-intl.dashscope.aliyuncs.com/v1"
)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
        return {"students": 80, "families": 65, "young professionals": 75, "tourists": 70}.get(x.lower(), 50)

    def trend(x):
        return {"coffee shop": 75, "restaurant": 72, "bubble tea": 78, "fashion": 70}.get(x.lower(), 50)

    def macro(x):
        return {"thailand": 72, "vietnam": 80, "indonesia": 78, "singapore": 68}.get(x.lower(), 50)

    def comp(x):
        return {"low": 85, "medium": 65, "high": 40}.get(x.lower(), 50)

    def loc(x):
        return {"bangkok": 75, "hanoi": 78, "ho chi minh city": 82, "chiang mai": 68}.get(x.lower(), 50)

    def fin(b):
        if b >= 300000:
            return 85
        elif b >= 150000:
            return 70
        elif b >= 50000:
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


def calculate_score(f):
    score = (
        f["demographic"] * 0.2 +
        f["trend"] * 0.2 +
        f["macro"] * 0.15 +
        f["competition"] * 0.15 +
        f["location"] * 0.2 +
        f["financial"] * 0.1
    )
    return round(score, 2)


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

Analyze this SME business case based on the real computed score below.

User Input:
- Business Type: {user_data["business_type"]}
- Country: {user_data["country"]}
- City: {user_data["city"]}
- Budget: {user_data["budget"]}
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

Instructions:
1. Explain why this business got this score.
2. Mention 2 strengths.
3. Mention 2 risks.
4. Give 3 actionable recommendations.
5. Keep the response concise and practical.
6. Do not invent a different score.

Return ONLY JSON:
{{
  "message": "...",
  "summary": "..."
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
        import re
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
    score = calculate_score(features)
    risk = get_risk(score)

    prompt = build_qwen_prompt(d, features, score, risk)
    qwen_result = ask_qwen(prompt)

    return {
        "score": score,
        "risk": risk,
        "features": features,
        "message": qwen_result.get("message", ""),
        "summary": qwen_result.get("summary", "")
    }