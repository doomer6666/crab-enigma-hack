import numpy as np
import re
from typing import Dict, List
from app.core.bert import embed_text

# 1. Чистим и дополняем прототипы (якоря)
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

# Предварительно считаем эмбеддинги (делаем это один раз при запуске)
TOPIC_EMBEDDINGS: Dict[str, np.ndarray] = {
    topic: np.array([embed_text(phrase) for phrase in phrases])
    for topic, phrases in TOPIC_PROTOTYPES.items()
}

def predict_topic(email_text: str, threshold=0.42):
    # 1. Разбиваем текст на предложения (убираем пустые и слишком короткие)
    # Это ключевой момент для работы с "водой" в письмах
    sentences = re.split(r'[.!?\n]', email_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 4]
    
    if not sentences:
        return "Другое"

    # 2. Получаем эмбеддинги для каждого предложения
    sentence_embs = [embed_text(s) for s in sentences]
    
    # Сюда будем писать лучший результат для каждой темы по всему письму
    topic_best_scores = {topic: 0.0 for topic in TOPIC_EMBEDDINGS.keys()}

    for topic, topic_vectors in TOPIC_EMBEDDINGS.items():
        for s_emb in sentence_embs:
            # Считаем сходство конкретного предложения со всеми якорями темы
            # Т.к. векторы нормализованы в bert.py, достаточно простого dot product
            similarities = np.dot(topic_vectors, s_emb) 
            current_max = np.max(similarities)
            
            # Если это предложение подходит теме лучше, чем предыдущие — обновляем
            if current_max > topic_best_scores[topic]:
                topic_best_scores[topic] = current_max

    # 3. Выбираем победителя
    best_topic = max(topic_best_scores, key=topic_best_scores.get)
    max_score = topic_best_scores[best_topic]

    # Отсекаем "хлеб" и прочий мусор
    if max_score < threshold:
        return "Другое"

    return best_topic

if __name__ == "__main__":
    test_emails = [
        "Тварь не работает, помогите!",
        "Сломалось, нужен сервисный центр!",
        "Пришлите свежий мануал на датчик",
        "Прошу предоставить актуальную версию руководства по эксплуатации для Газконтроль-01 IR CH4 (редакция 2025 г. или новее), а также файл с перечнем запасных частей и рекомендуемыми сроками их замены.",
        "Вчера купили хлеб в магазине"
    ]

    print(f"{'РЕЗУЛЬТАТЫ ТЕСТА':^80}")
    print("-" * 80)
    for email in test_emails:
        topic = predict_topic(email)
        # Ограничим вывод текста для красоты
        short_text = (email[:75] + '..') if len(email) > 75 else email
        print(f"Текст: {short_text}")
        print(f"Определено: {topic}\n")