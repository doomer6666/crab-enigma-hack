def classify(text: str):
    text_lower = text.lower()

    if "не могу войти" in text_lower or "логин" in text_lower:
        return "auth", "high", "negative", 0.75
    
    if "оплата" in text_lower or "списали" in text_lower:
        return "billing", "critical", "negative", 0.8
    
    if "спасибо" in text_lower:
        return "feedback", "low", "positive", 0.9

    return "general", "medium", "neutral", 0.5