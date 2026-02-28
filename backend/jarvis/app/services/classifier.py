import numpy as np
import re
from typing import Dict, List
from app.core.bert import embed_text

TOPIC_PROTOTYPES = {
    "Неисправность": ["не работает", "сломался", "ошибка", "глючит", "завис", "не включается", "поломка"],
    "Калибровка": ["калибровка", "настройка датчика", "откалибровать", "корректировка", "поверка", "точность"],
    "Запрос документации": ["инструкция", "manual", "руководство", "паспорт", "схема", "чертеж", "мануал", "документация", "актуальная версия", "перечень запчастей"],
    "Подключение и ПО": ["подключение", "софт", "драйвер", "прошивка", "firmware", "программное обеспечение", "установка"],
    "Запрос пароля": ["пароль", "password", "код доступа", "логин", "админ"],
    "Монтаж и установка": ["монтаж", "установка", "закрепить", "сборка"],
    "Гарантия и ремонт": ["сервисный центр", "рекламация", "акт поломки", "отремонтировать", "починить", "гарантийный случай"
],
}

TOPIC_EMBEDDINGS: Dict[str, np.ndarray] = {
    topic: np.array([embed_text(phrase) for phrase in phrases])
    for topic, phrases in TOPIC_PROTOTYPES.items()
}

def predict_topic(email_text: str, threshold=0.42):
    sentences = re.split(r'[.!?\n]', email_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 4]
    
    if not sentences:
        return "Другое"

    sentence_embs = [embed_text(s) for s in sentences]
    
    topic_best_scores = {topic: 0.0 for topic in TOPIC_EMBEDDINGS.keys()}

    for topic, topic_vectors in TOPIC_EMBEDDINGS.items():
        for s_emb in sentence_embs:
            similarities = np.dot(topic_vectors, s_emb) 
            current_max = np.max(similarities)
            
            if current_max > topic_best_scores[topic]:
                topic_best_scores[topic] = current_max

    best_topic = max(topic_best_scores, key=topic_best_scores.get)
    max_score = topic_best_scores[best_topic]

    if max_score < threshold:
        return "Другое"

    return best_topic