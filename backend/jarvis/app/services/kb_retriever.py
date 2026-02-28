from app.core.bert import embed_text
import numpy as np

# временная KB (потом заменится на postgres + pgvector)
KB = [
    {
        "text": "Как сбросить пароль через форму восстановления",
        "category": "auth"
    },
    {
        "text": "Проверка транзакции при списании средств",
        "category": "billing"
    },
    {
        "text": "Перезапуск устройства для устранения ошибки",
        "category": "technical"
    }
]

# создаём embedding KB при старте
KB_EMBEDDINGS = [embed_text(item["text"]) for item in KB]


def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def retrieve_answer(text: str) -> list[str]:
    try:
        query_emb = embed_text(text)

        scores = [
            cosine(query_emb, kb_emb)
            for kb_emb in KB_EMBEDDINGS
        ]

        best_idx = int(np.argmax(scores))

        return [KB[best_idx]["text"]]

    except Exception:
        return []