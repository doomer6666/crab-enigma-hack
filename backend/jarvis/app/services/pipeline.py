from app.services.classifier import predict_topic
from app.services.generator import generate_reply
from app.services.kb_retriever import retrieve_answer
from app.services.mail_extractor import extract_entities
from app.services.tone_resolver import ToneResolver

from backend.jarvis.app.services.rag_service import RagService


class JarvisDataEntity:
    def __init__(self,
                 sender_name=None,
                 phone=None,
                 object_name=None,
                 serial_numbers=None,
                 device_type=None,
                 category=None,
                 sentiment=None,
                 confidence=None,
                 ai_draft=None):
        self.sender_name = sender_name
        self.phone = phone
        self.object_name = object_name
        self.serial_numbers = serial_numbers
        self.device_type = device_type
        self.category = category
        self.sentiment = sentiment
        self.confidence = confidence
        self.ai_draft = ai_draft


def process_email(text):
    entities = extract_entities(text)
    name = entities.name or ""
    phone = entities.phone or ""
    company = entities.company or ""
    serial = entities.serial_number or ""
    item_type = entities.item_type or ""

    category = predict_topic(text)

    resolver = ToneResolver()
    tone = resolver.resolve(text)

    kb = retrieve_answer(text, category)
    service = RagService()
    test_entities = {
        "device": f"{serial} {item_type}".strip(),
        "issue": text,
        "name": name
    }

    reply = service.resolve_answer(test_entities, mood="negative")

    return JarvisDataEntity(
        sender_name=name,
        phone=phone,
        object_name=company,
        serial_numbers=serial,
        device_type=item_type,
        category=category,
        sentiment=tone,
        confidence=0.9,
        ai_draft=reply
    )
