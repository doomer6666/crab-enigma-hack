from app.services.classifier import predict_topic
from app.services.generator import generate_reply
from app.services.kb_retriever import retrieve_answer
from app.services.mail_extractor import extract_entities
from app.services.tone_resolver import ToneResolver


class JarvisDataEntity:
    def __init__(self):
        self.sender_name = None
        self.phone = None
        self.object_name = None
        self.serial_numbers = None
        self.device_type = None
        self.category = None
        self.sentiment = None
        self.confidence = None
        self.ai_draft = None


def process_email(text):

    entities = extract_entities(text)

    category = predict_topic(text)

    resolver = ToneResolver()
    tone = resolver.resolve(text)

    kb = retrieve_answer(text, category)
    reply = generate_reply(category, kb)

    return JarvisDataEntity(entities.get("name"),
                           entities.get("phone"),
                           entities.get("company"),
                           entities.get("serial_number"),
                           entities.get("item_type"),
                           category,
                           tone,
                           0.9,  # confidence
                           reply)