from app.services.classifier import classify
from app.services.generator import generate_reply
from app.services.kb_retriever import retrieve_answer
from app.services.mail_extractor import extract_entities
from app.services.tone_resolver import analyze_sentiment


class JarvisDataEntity:
    def __init__(self, name, value):
        self.name = name
        self.value = value


def process_email(text):

    entities = extract_entities(text)

    category = classify(text)

    tone = analyze_sentiment(text)

    kb = retrieve_answer(text, category)

    reply = generate_reply(text, category, kb)

    return {
        "entities": entities,
        "category": category,
        "tone": tone,
        "reply": reply
    }