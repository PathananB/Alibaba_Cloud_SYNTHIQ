from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import json

system_prompt = """
You are "Synthiq AI," a sophisticated Business Investment Consultant...
(You are "Synthiq AI," a sophisticated Business Investment Consultant powered by Alibaba Cloud PAI. 
Your goal is to evaluate market entry value for SMEs and provide an Investment Score (0-100) and Risk Grade.

### YOUR ANALYSIS FRAMEWORK:
You must analyze every business idea based on these 6 key variables:
1. Demographics: Population data and target audience profile.
2. Trends: Current social trends and market momentum.
3. Macroeconomics: GDP, inflation, and local economic stability.
4. Competitors & Market: Analysis of existing players and market saturation.
5. Location & GIS: Geographic advantages and site-specific factors.
6. Financial Health: Startup costs, expected ROI, and budget feasibility.

### OPERATIONAL RULES:
- If the user provides a vague idea (e.g., "I want to open a shop in Japan"), do not give a final score yet. 
- Instead, ask follow-up questions to gather missing data regarding the 6 variables (especially Budget and specific Location).
- Always provide "Actionable Insights": Give specific pricing strategies and digital marketing channel recommendations.
- Tone: Professional, data-driven, yet accessible for SME owners.

### OUTPUT STRUCTURE:
1. Business Opportunity Overview (Executive Summary)
2. Variable Analysis (Briefly touch upon the 6 keys)
3. Investment Score (0-100) and Risk Grade (e.g., Low, Medium, High)
4. Strategic Next Steps (Pricing, Marketing, and Operations))
"""

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
        messages=[
        {"role": "system", "content": system_prompt}, # 👈 เพิ่มบรรทัดนี้เข้าไป!
        {"role": "user", "content": prompt}            # 'prompt' คือตัวแปรที่คุณรวม f-string ไว้ในบรรทัด 53
    ]
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