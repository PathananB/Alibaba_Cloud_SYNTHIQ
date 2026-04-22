from typing import Dict, Any


def convert_inputs_to_features(data: Dict[str, Any]) -> Dict[str, float]:
    def demo(x):
        return {
            "students": 80,
            "families": 65,
            "young professionals": 75,
            "tourists": 70
        }.get(str(x).lower(), 50)

    def trend(x):
        return {
            "coffee shop": 75,
            "restaurant": 72,
            "bubble tea": 78,
            "fashion": 70
        }.get(str(x).lower(), 50)

    def macro(x):
        return {
            "thailand": 72,
            "vietnam": 80,
            "indonesia": 78,
            "singapore": 68
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
        except:
            b = 0

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


def get_risk(score: float) -> str:
    if score >= 75:
        return "Low"
    elif score >= 55:
        return "Medium"
    else:
        return "High"


def build_strengths(data: Dict[str, Any], features: Dict[str, float]) -> list[str]:
    strengths = []

    if features["competition"] >= 80:
        strengths.append("Low competition supports easier market entry.")
    if features["location"] >= 80:
        strengths.append("The selected location has strong commercial potential.")
    if features["financial"] >= 80:
        strengths.append("The budget is strong enough to support launch activities.")
    if features["trend"] >= 75:
        strengths.append("The business type shows promising market interest.")
    if features["demographic"] >= 75:
        strengths.append("The target customer group matches the business concept well.")

    if not strengths:
        strengths.append("This business has moderate potential with the right execution.")

    return strengths[:3]


def build_risks(data: Dict[str, Any], features: Dict[str, float]) -> list[str]:
    risks = []

    if features["competition"] <= 50:
        risks.append("High competition may reduce visibility and margins.")
    if features["financial"] <= 50:
        risks.append("Limited budget may constrain launch and marketing efforts.")
    if features["location"] <= 60:
        risks.append("The selected location may have weaker demand or traffic.")
    if str(data["business_type"]).lower() == "fashion":
        risks.append("Fashion demand can shift quickly with trends and seasons.")

    if not risks:
        risks.append("Execution quality will still strongly affect final business performance.")

    return risks[:3]


def build_recommendations(data: Dict[str, Any], features: Dict[str, float]) -> list[str]:
    recommendations = []

    if features["financial"] <= 55:
        recommendations.append("Start lean and focus on essential launch spending first.")
    else:
        recommendations.append("Use part of the budget for targeted marketing and customer acquisition.")

    if features["competition"] <= 60:
        recommendations.append("Differentiate clearly through branding, pricing, or customer experience.")

    target = str(data["target_customer"]).lower()
    if target == "tourists":
        recommendations.append("Partner with hotels, travel pages, or local attractions.")
    elif target == "students":
        recommendations.append("Use student pricing and social-media-driven promotions.")
    elif target == "young professionals":
        recommendations.append("Focus on convenience, quality, and digital-first campaigns.")
    elif target == "families":
        recommendations.append("Design family-friendly promotions and group-value offers.")

    return recommendations[:3]