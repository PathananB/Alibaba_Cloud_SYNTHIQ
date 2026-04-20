from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key="sk-sp-601cd068acc64f64bfced0eb509d04d4",
    base_url="https://coding-intl.dashscope.aliyuncs.com/v1"
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    prompt = f"""
Analyze this business idea: "{request.message}"

Return ONLY JSON:
{{
  "message": "...",
  "score": "...",
  "risk": "...",
  "summary": "..."
}}

DO NOT include anything outside JSON.
"""

    response = client.chat.completions.create(
        model="qwen3.6-plus",
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.choices[0].message.content

    # 🔥 กัน AI ตอบมั่ว
    try:
        data = json.loads(text)
    except:
        import re
        match = re.search(r"\{.*\}", text, re.DOTALL)
        data = json.loads(match.group()) if match else {
            "message": text,
            "score": "N/A",
            "risk": "Unknown",
            "summary": "Parsing failed"
        }

    return data  # 🔥 ส่ง JSON จริงกลับไปเลย