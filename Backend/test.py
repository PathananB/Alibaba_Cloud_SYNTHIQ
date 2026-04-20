from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

app = FastAPI()

# ยอมรับการเชื่อมต่อจาก Frontend (แก้ปัญหา CORS)
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
    response = client.chat.completions.create(
        model="qwen3.6-plus",
        messages=[{"role": "user", "content": request.message}]
    )
    return {"reply": response.choices[0].message.content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)