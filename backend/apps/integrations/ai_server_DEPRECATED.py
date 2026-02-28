import logging
from django.conf import settings

# Импортируем функции НАПРЯМУЮ из кода Jarvis
# Путь: backend/jarvis/app/services/...
try:
    from jarvis.app.services.classifier import classify_text
    from jarvis.app.services.generator import generate_reply
    from jarvis.app.services.kb_retriever import retrieve_context
    from jarvis.app.services.fallback import fallback_classification, fallback_reply
except ImportError as e:
    # Чтобы не падало при migrate, если папки еще нет
    logging.warning(f"Jarvis modules not found: {e}")
    classify_text = None

logger = logging.getLogger(__name__)

class JarvisService:
    @staticmethod
    def process_ticket(text: str):
        """
        Вызывает функции Jarvis (классификация + генерация)
        Возвращает словарь с данными для тикета.
        """
        if not classify_text:
            logger.error("Jarvis modules are missing!")
            return None

        try:
            # 1. КЛАССИФИКАЦИЯ
            # Функция classify_text возвращает кортеж (category, priority, sentiment, confidence)
            try:
                category, priority, sentiment, confidence = classify_text(text)
            except Exception as e:
                logger.error(f"Classifier error: {e}")
                # Fallback если ML упал
                fb = fallback_classification()
                category = fb['category']
                priority = fb['priority']
                sentiment = fb['sentiment']
                confidence = fb['confidence']

            # 2. ПОИСК В БАЗЕ ЗНАНИЙ (Context Retrieval)
            try:
                # retrieve_context возвращает строку или список строк
                kb_context = retrieve_context(text)
            except Exception:
                kb_context = ""

            # 3. ГЕНЕРАЦИЯ ОТВЕТА
            try:
                # generate_reply(text, category, context) -> str
                ai_draft = generate_reply(text, category, kb_context)
            except Exception as e:
                logger.error(f"Generator error: {e}")
                ai_draft = fallback_reply()

            # 4. ФОРМИРУЕМ РЕЗУЛЬТАТ
            return {
                'category': category,
                'priority': priority,
                'sentiment': sentiment,
                'confidence': confidence,
                'ai_draft': ai_draft,
                # 'description': ... # Если Jarvis умеет выделять суть (summary), добавь функцию сюда
            }

        except Exception as e:
            logger.error(f"Critical Jarvis error: {e}")
            return None