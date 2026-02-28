import numpy as np
import re
from typing import Dict
from app.core.bert import embed_text


TOPIC_PROTOTYPES = {
    "Неисправность": ["вышел из строя прибор", "не работает датчик", "сломался", "ошибка системы", "постоянно виснет", "не включается устройство"],
    "Калибровка": ["провести калибровку", "настройка точности", "откалибровать", "поверка прибора", "погрешность измерений"],
    "Запрос документации": ["пришлите документацию", "нужна инструкция пользователя", "manual руководство", "паспорт на изделие", "чертежи и схемы"],
    "Подключение и ПО": ["установить софт", "драйвер для связи", "прошивка firmware", "программное обеспечение", "подключить к компьютеру"],
    "Запрос пароля": ["пароль администратора", "password", "код доступа в меню", "логин для входа"],
    "Монтаж и установка": ["монтажные работы на объекте", "установка оборудования", "сборка и закрепление", "размещение на трубе", "фундамент и монтаж"],
    "Гарантия и ремонт": ["гарантийный ремонт", "отправить в сервис", "рекламационный акт", "гарантийный случай", "починить по гарантии"],
}

TOPIC_EMBEDDINGS: Dict[str, np.ndarray] = {
    topic: np.array([embed_text(phrase) for phrase in phrases])
    for topic, phrases in TOPIC_PROTOTYPES.items()
}

TOPIC_CENTROIDS: Dict[str, np.ndarray] = {}
for topic, phrases in TOPIC_PROTOTYPES.items():
    vectors = [embed_text(p) for p in phrases]
    centroid = np.mean(vectors, axis=0)
    TOPIC_CENTROIDS[topic] = centroid / np.linalg.norm(centroid)

def cosine_similarity(v1, v2_matrix):
    v1_norm = v1 / np.linalg.norm(v1)
    v2_norms = np.linalg.norm(v2_matrix, axis=1)
    v2_normalized = v2_matrix / v2_norms[:, np.newaxis]
    return np.dot(v2_normalized, v1_norm)

def predict_topic(email_text: str, threshold=0.45): 
    sentences = re.split(r'[.!?\n]', email_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
    
    if not sentences:
        return "Другое"

    letter_embs = [embed_text(s) for s in sentences]
    topic_scores = {}

    for topic, centroid in TOPIC_CENTROIDS.items():
        scores = []
        for s_emb in letter_embs:
            s_norm = s_emb / (np.linalg.norm(s_emb) + 1e-9)
            score = np.dot(s_norm, centroid)
            scores.append(score)
        
        topic_scores[topic] = np.max(scores)

    best_topic = max(topic_scores, key=topic_scores.get)
    max_score = topic_scores[best_topic]

    if max_score < threshold:
        return "Другое"

    return best_topic