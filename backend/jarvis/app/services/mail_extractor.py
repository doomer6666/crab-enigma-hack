import re
from .models_parser import read_models

SERIAL_REGEX = r"\b[A-Z]{2}\d{9}\b"
PHONE_REGEX = r"\+?\d[\d\-\(\) ]{8,}\d"
NAME_REGEX = r"[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+"
COMPANY_REGEX = r"(ООО|АО|ЗАО)\s+«[^»]+»"

class ExtractedEmail:
    def __init__(self, text):
        self.name = None
        self.phone = None
        self.company = None
        self.serial_number = None
        self.item_type = None

def normalize(text):
    text = text.lower()
    text = text.replace("ё", "е")
    text = re.sub(r"[^\w\s\-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text

def extract_serial(text):
    match = re.search(SERIAL_REGEX, text)
    return match.group(0) if match else None

def extract_item_type(text, models):
    text_norm = normalize(text)
    for model in models:
        key = normalize(model)
        tokens = key.split()
        for token in tokens:
            if len(token) < 4:
                continue
            if token in text_norm:
                return model
    return None

def extract_entities(text, models):
    result = ExtractedEmail(text)

    name = re.search(NAME_REGEX, text)
    if name:
        result.name = name.group(0)

    phone = re.search(PHONE_REGEX, text)
    if phone:
        result.phone = phone.group(0)

    company = re.search(COMPANY_REGEX, text)
    if company:
        result.company = company.group(0)

    result.serial_number = extract_serial(text)

    if models:
        result.item_type = extract_item_type(text, models)

    return result

# if __name__ == "__main__":
#     models = read_models()
#     email_text = """
#     Дата: 05.02.2026
# ФИО: Королёв Артём Николаевич
# Объект: ООО «ТехноГаз»
# Телефон: +7 (495) 333-22-11
# Email: a.korolev@technogaz.ru
# Прошу предоставить актуальную версию руководства по эксплуатации для Газконтроль-01 IR CH4 (редакция 2025 г. или новее), а также файл с перечнем запасных частей и рекомендуемыми сроками их замены.
# ER414260001
#     """
#     extracted = extract_entities(email_text, models)
#     print(vars(extracted))