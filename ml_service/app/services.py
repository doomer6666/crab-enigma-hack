def classify_text(text: str):
    text_lower = text.lower()

    category = "General"
    priority = "medium"
    sentiment = "neutral"
    confidence = 0.75

    if "error" in text_lower or "bug" in text_lower:
        category = "Technical issue"
        priority = "high"

    if "payment" in text_lower or "refund" in text_lower:
        category = "Payment"
        priority = "critical"

    if "thank" in text_lower:
        sentiment = "positive"

    if "not working" in text_lower or "angry" in text_lower:
        sentiment = "negative"

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment,
        "confidence": confidence
    }


def generate_draft(text: str, context=None):
    return f"""
Hello!

Thank you for contacting support.

We received your message:
"{text[:200]}"

Our team is already reviewing your issue. 
We will get back to you shortly.

Best regards,
Support Team
""".strip()