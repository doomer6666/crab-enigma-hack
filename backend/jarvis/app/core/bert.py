from transformers import AutoTokenizer, AutoModel
import torch
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../jarvis_core"
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModel.from_pretrained(MODEL_PATH)
model.eval()


def embed_text(text: str):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True
    )

    with torch.no_grad():
        outputs = model(**inputs)

    # mean pooling
    embeddings = outputs.last_hidden_state.mean(dim=1)

    return embeddings.squeeze().numpy()