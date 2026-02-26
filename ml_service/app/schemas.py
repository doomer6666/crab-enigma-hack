from pydantic import BaseModel
from typing import List, Optional


class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    category: str
    priority: str
    sentiment: str
    confidence: float


class GenerateRequest(BaseModel):
    text: str
    context: Optional[List[str]] = []


class GenerateResponse(BaseModel):
    draft: str