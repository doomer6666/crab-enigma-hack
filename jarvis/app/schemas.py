from pydantic import BaseModel
from typing import List, Optional

class ClassifyRequest(BaseModel):
    text: str
    ticket_id: Optional[str] = None

class ClassifyResponse(BaseModel):
    category: str
    priority: str
    sentiment: str
    confidence: float


class GenerateRequest(BaseModel):
    text: str
    category: str
    kb_context: List[str] = []

class GenerateResponse(BaseModel):
    draft: str