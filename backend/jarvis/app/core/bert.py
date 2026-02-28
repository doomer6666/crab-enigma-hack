import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../jarvis_core_alter"
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModel.from_pretrained(MODEL_PATH)
model.eval()

def embed_text(text: str):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512
    )

    with torch.no_grad():
        outputs = model(**inputs)

    attention_mask = inputs['attention_mask']
    last_hidden_state = outputs.last_hidden_state
    
    mask = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
    
    sum_embeddings = torch.sum(last_hidden_state * mask, 1)
    sum_mask = torch.clamp(mask.sum(1), min=1e-9)
    embedding = sum_embeddings / sum_mask

    embedding = F.normalize(embedding, p=2, dim=1)

    return embedding.squeeze().cpu().numpy()