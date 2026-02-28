import numpy as np
from app.core.bert import embed_text

# короткие якорные фразы эмоций
SENTIMENT_PROTOTYPES = {
    "positive": "спасибо, благодарю, отлично, помогли",
    "neutral": "вопрос, уточнение, информация",
    "negative": "не работает, ошибка, проблема, недоволен"
}

# считаем один раз при старте
PROTOTYPE_EMB = {
    k: embed_text(v)
    for k, v in SENTIMENT_PROTOTYPES.items()
}


def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def analyze_sentiment(text: str):
    try:
        text_emb = embed_text(text)

        scores = {
            sentiment: cosine(text_emb, proto_emb)
            for sentiment, proto_emb in PROTOTYPE_EMB.items()
        }

        return max(scores, key=scores.get)

    except Exception:
        return "neutral"