def generate_reply(text: str, category: str, kb_context: list[str]):

    base = {
        "auth": "Попробуйте сбросить пароль через форму восстановления.",
        "billing": "Мы проверим транзакцию и свяжемся с вами.",
        "technical": "Пожалуйста, уточните детали проблемы.",
        "general": "Мы рассмотрим ваш вопрос."
    }

    kb = " ".join(kb_context)

    return f"""
Здравствуйте!

Спасибо за ваше обращение.

{base.get(category, base['general'])}

{kb}

С уважением,
Техподдержка
""".strip()