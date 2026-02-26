def retrieve_context(text: str) -> list[str]:
    text_lower = text.lower()

    if "пароль" in text_lower:
        return ["Вы можете сбросить пароль через форму восстановления."]

    if "оплата" in text_lower or "списали" in text_lower:
        return ["Пожалуйста, уточните дату и сумму транзакции."]

    if "ошибка" in text_lower:
        return ["Попробуйте перезапустить приложение и очистить кэш."]

    return []