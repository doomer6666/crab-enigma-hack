import numpy as np
from app.core.bert import embed_text

class ToneResolver:
    def __init__(self):
        self.negative_triggers = ["ужас", "плохо", "не работает", "срочно", "невозможно", "возмущен"]
        self.positive_triggers = ["спасибо", "благодарю", "отлично", "круто", "помогло", "лучшие"]

        self.neg_anchor = np.array(embed_text("я недоволен, всё плохо, проблема, ошибка, ужасный сервис"))
        self.pos_anchor = np.array(embed_text("я очень доволен, спасибо за помощь, отличная работа, всё супер"))
        self.neut_anchor = np.array(embed_text("добрый день, уточните статус, информационный запрос, обычный вопрос"))

    def resolve(self, text: str) -> str:
            text_lower = text.lower().strip()
            
            if any(w in text_lower for w in ["где мой", "ужас", "плохо", "срочно", "неделю"]):
                return "negative"
                
            emb = np.array(embed_text(text_lower))
            
            pos_sim = np.dot(emb, self.pos_anchor)
            neg_sim = np.dot(emb, self.neg_anchor)
            neut_sim = np.dot(emb, self.neut_anchor)

            if "!" in text_lower or text_lower.startswith("где"):
                neut_sim -= 0.1 

            scores = {"positive": pos_sim, "negative": neg_sim, "neutral": neut_sim}
            best_tone = max(scores, key=scores.get)

            if abs(pos_sim - neg_sim) < 0.02 and best_tone != "neutral":
                return "neutral"
            
            return best_tone