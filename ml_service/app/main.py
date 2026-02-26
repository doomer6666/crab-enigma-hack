from fastapi import FastAPI
from app.schemas import (
    ClassifyRequest,
    ClassifyResponse,
    GenerateRequest,
    GenerateResponse
)
from app.services import classify_text, generate_draft

app = FastAPI(title="Jarvis ML Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest):
    result = classify_text(request.text)
    return result


@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    draft = generate_draft(request.text, request.context)
    return {"draft": draft}