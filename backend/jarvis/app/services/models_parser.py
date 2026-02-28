import requests
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0"}

def read_models():

    models = []

    for page in range(1, 3):
        url = f"https://eriskip.com/ru/products?page={page}&per-page=15"
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.text, "html.parser")

        for h in soup.select("h3 a[href*='/ru/product/']"):
            name = h.get_text(strip=True)
            models.append(name)

    models = list(dict.fromkeys(models))

    return models