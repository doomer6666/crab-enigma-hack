import numpy as np
from typing import List
from app.core.bert import embed_text


KB = [
    {
        "text": "Попробуйте выполнить перезапуск устройства для устранения ошибки.",
        "category": "Неисправность",
    },
    {
        "text": "Для проведения калибровки воспользуйтесь инструкцией в паспорте прибора.",
        "category": "Калибровка",
    },
    {
        "text": "Актуальную документацию можно скачать на официальном сайте.",
        "category": "Запрос документации",
    },
    {
        "text": "Убедитесь, что установлены последние драйверы и прошивка.",
        "category": "Подключение и ПО",
    },
    {
        "text": "Для восстановления пароля используйте форму сброса на странице входа.",
        "category": "Запрос пароля",
    },
    {
        "text": "Монтаж необходимо выполнять согласно инструкции по установке.",
        "category": "Монтаж и установка",
    },
    {
        "text": "Для гарантийного ремонта обратитесь в сервисный центр.",
        "category": "Гарантия и ремонт",
    },
]


KB_EMBEDDINGS = [embed_text(item["text"]) for item in KB]


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def retrieve_answer(text: str, category: str, top_k: int = 1) -> List[str]:
    if not text:
        return []

    query_emb = embed_text(text)

    candidates = [
        (idx, item)
        for idx, item in enumerate(KB)
        if item["category"] == category
    ]

    if not candidates:
        return []

    scored = []

    for idx, _ in candidates:
        score = cosine(query_emb, KB_EMBEDDINGS[idx])
        scored.append((idx, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    return [KB[idx]["text"] for idx, _ in scored[:top_k]]