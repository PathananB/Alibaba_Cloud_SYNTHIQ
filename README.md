# SYNTHIQ AI

> **AI-Powered Business Intelligence & Investment Analysis**

SYNTHIQ AI is an AI-powered platform that helps users evaluate business opportunities and investment potential using **Machine Learning, Market Trends, Macroeconomic Data, and Generative AI**.

## ✨ Features

* 📊 **Investment Score** — วิเคราะห์และให้คะแนนโอกาสในการลงทุน
* 📈 **Market Trend Analysis** — วิเคราะห์แนวโน้มตลาดจาก Google Trends
* 🌍 **Macroeconomic Analysis** — ใช้ข้อมูล GDP จาก World Bank
* ⚠️ **Risk Assessment** — ประเมินระดับความเสี่ยง Low / Medium / High
* 🤖 **AI Business Insights** — ใช้ Qwen AI วิเคราะห์จุดแข็ง ความเสี่ยง และคำแนะนำ
* 📄 **Insight Report** — สรุปผลการวิเคราะห์ในรูปแบบรายงาน

## 🛠️ Tech Stack

**Frontend**

* HTML
* CSS
* JavaScript

**Backend**

* Python
* FastAPI
* Uvicorn
* Scikit-learn

**AI & Data**

* Qwen AI
* Google Trends / SerpAPI
* World Bank API
* Machine Learning

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/PathananB/Alibaba_Cloud_SYNTHIQ.git
cd Alibaba_Cloud_SYNTHIQ
```

### Run Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

### Environment Variables

Create `.env` in `Backend/`:

```env
QWEN_API_KEY=your_api_key
SERPAPI_KEY=your_api_key
```

> **Never commit API keys or secrets to GitHub.**

## 🔄 Workflow

```text
Business Input
      ↓
Feature Analysis
      ↓
Market + Economic Data
      ↓
Machine Learning Model
      ↓
Investment Score
      ↓
Qwen AI Analysis
      ↓
Business Insight Report
```

## 👥 Project

**SYNTHIQ AI** — AI-powered business opportunity and investment analysis platform.

🔗 https://github.com/PathananB/Alibaba_Cloud_SYNTHIQ
