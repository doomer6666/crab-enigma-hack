from app.core.bert import embed_text
import numpy as np


def generate_reply(text: str, category: str, kb_context: list[str]):

    base = {
        "auth": "Ваш запрос связан с доступом к системе.",
        "billing": "Ваш запрос касается финансовых операций.",
        "technical": "Вы столкнулись с технической проблемой.",
        "general": "Спасибо за обращение."
    }

    kb = "\n".join(kb_context)

    return f"""
Здравствуйте!

Спасибо за ваше обращение.

{base.get(category, base['general'])}

Рекомендуемое решение:
{kb}

Если проблема сохраняется — сообщите дополнительные детали.

С уважением,
Техподдержка
""".strip()