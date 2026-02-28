from fastapi import FastAPI
from app.schemas import *
from app.services.classifier import classify_text
from app.services.generator import generate_reply
from app.services.kb_retriever import retrieve_context
from app.services.fallback import fallback_classification, fallback_reply
from app.core.config import settings

app = FastAPI(title="Jarvis ML Service")


@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    try:
        if settings.CLASSIFIER_MODE == "rule":
            category, priority, sentiment, confidence = classify_text(req.text)
        else:
            # здесь потом будет bert
            raise NotImplementedError()

        return ClassifyResponse(
            category=category,
            priority=priority,
            sentiment=sentiment,
            confidence=confidence
        )

    except Exception:
        fb = fallback_classification()
        return ClassifyResponse(**fb)


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
        kb_context = retrieve_context(req.text)

        if settings.GENERATION_MODE == "template":
            draft = generate_reply(req.text, req.category, kb_context)
        else:
            # здесь потом будет RAG
            raise NotImplementedError()

        return GenerateResponse(draft=draft)

    except Exception:
        return GenerateResponse(draft=fallback_reply())