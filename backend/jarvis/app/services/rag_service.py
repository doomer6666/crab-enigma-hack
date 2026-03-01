import os
import re
import warnings
from dotenv import load_dotenv
# МЕНЯЕМ ЛОАДЕР
from langchain_community.document_loaders import PDFPlumberLoader 
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

warnings.filterwarnings("ignore", category=UserWarning)
load_dotenv()

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../../jarvis_big_brother"))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
PDF_DIR = os.path.join(BACKEND_DIR, "data", "manuals")
DB_DIR = os.path.join(BACKEND_DIR, "data", "faiss_index")

GROQ_API_KEY = "" # йоу

class RagService:
    def __init__(self):
        print("--- Инициализация RagService ---")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=MODEL_PATH,
            model_kwargs={'device': 'cpu'}
        )
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=300)

        if os.path.exists(DB_DIR) and len(os.listdir(DB_DIR)) > 0:
            print("Загружаем FAISS...")
            self.vector_db = FAISS.load_local(DB_DIR, self.embeddings, allow_dangerous_deserialization=True)
        else:
            print("Создаём новый индекс...")
            self.vector_db = self._create_db()

        self.llm = ChatGroq(temperature=0, groq_api_key=GROQ_API_KEY, model_name="llama-3.1-8b-instant")

    def _create_db(self):
        if not os.path.exists(PDF_DIR): return None
        all_chunks = []
        files = [f for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]

        for file_name in files:
            try:
                print(f"Глубокая обработка: {file_name}")
                loader = PDFPlumberLoader(os.path.join(PDF_DIR, file_name))
                pages = loader.load()
                
                for page in pages:
                    page.metadata = {"source": file_name, "page": page.metadata.get("page", 0)}
                
                chunks = self.text_splitter.split_documents(pages)
                for chunk in chunks:
                    chunk.page_content = f"passage: {chunk.page_content}"
                    all_chunks.append(chunk)
            except Exception as e:
                print(f"Ошибка {file_name}: {e}")

        if not all_chunks: return None
        db = FAISS.from_documents(all_chunks, self.embeddings)
        db.save_local(DB_DIR)
        return db

    def _route_to_file(self, device: str, all_files: list) -> str | None:
        file_mapping = {str(i + 1): f for i, f in enumerate(all_files)}
        files_str = "\n".join([f"{k}. {v}" for k, v in file_mapping.items()])
        system_msg = "Ты — роутер техподдержки. Напиши только цифру самого подходящего файла или 0."
        user_msg = f"Устройство: '{device}'\nФайлы:\n{files_str}"
        try:
            raw = self.llm.invoke([("system", system_msg), ("human", user_msg)]).content.strip()
            match = re.search(r'\d+', raw)
            return file_mapping.get(match.group()) if match else None
        except: return None

    def resolve_answer(self, entities: dict, mood: str) -> dict:
        if not self.vector_db:
            return {"answer": "База знаний пуста.", "sources": []}

        device = entities.get('device', '').strip()
        issue = entities.get('issue', '').strip()
        all_files = [f for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]
        
        selected_file = self._route_to_file(device, all_files)

        search_prompt = f"Вопрос пользователя: '{issue}'. Напиши 3-4 ключевых слова или фразы на русском, которые могут встретиться в технической инструкции для ответа на этот вопрос. Пиши только слова через пробел."
        search_query_refined = self.llm.invoke(search_prompt).content.strip()
        
        final_query = f"query: {issue} {search_query_refined}"
        print(f"[DEBUG] Расширенный запрос: {final_query}")

        docs_with_scores = self.vector_db.similarity_search_with_score(
            final_query, 
            k=15, 
            filter={"source": selected_file} if selected_file else None
        )
        final_docs = [doc for doc, score in docs_with_scores]

        if not final_docs:
             final_docs = self.vector_db.similarity_search(final_query, k=5)

        context_text = ""
        for i, d in enumerate(final_docs):
            content = d.page_content.replace("passage: ", "")
            context_text += f"\n[Источник: {d.metadata.get('source')}, Стр: {d.metadata.get('page', 0)+1}]\n{content}\n"

        system_msg = (
            "Ты — ведущий инженер технической поддержки ЭРИС.\n"
            "Ты отвечаешь клиентам строго на основе технической документации.\n\n"

            "ТВОЯ ЗАДАЧА:\n"
            "Найти ответ в предоставленных отрывках документации и оформить его как понятное сообщение клиенту.\n\n"

            "ФОРМАТ ОТВЕТА:\n"
            "1. Обращайся к клиенту по имени (если имя передано).\n"
            "2. Пиши как инженер поддержки, а не как инструкция.\n"
            "3. Кратко сформулируй суть ответа.\n"
            "4. Затем приведи подтверждение из документации.\n"
            "5. Если точного ответа в документации нет — НЕ делай предположений и НЕ используй косвенные выводы.\n"
            "6. В таком случае честно сообщи, что в документации нет информации по данному вопросу.\n"
            "7. Если ответ найден — обязательно укажи, на какие данные из документации он опирается.\n"
            "8. Предпочтительно ссылаться на конкретные параметры, списки или ограничения из текста.\n"
            "9. Не пересказывай общими словами — опирайся на документацию.\n\n"

            "СТИЛЬ:\n"
            "- Вежливый\n"
            "- Профессиональный\n"
            "- Чёткий\n"
            "- Без догадок и предположений\n\n"

            "ВАЖНО:\n"
            "Лучше указать, что информация отсутствует, чем предположить."
        )

        user_msg = f"Устройство: {device}\nВопрос: {issue}\n\nДОКУМЕНТАЦИЯ ДЛЯ АНАЛИЗА:\n{context_text},\n\nИМЯ клиента\n{entities.get('name')}"
        
        response = self.llm.invoke([("system", system_msg), ("human", user_msg)])
        
        greeting = "Приносим искренние извинения за неудобства.\n\n" if mood == 'negative' else ""
        
        sources = []
        seen = set()
        for d in final_docs:
            p = d.metadata.get('page', 0) + 1
            if p not in seen:
                sources.append({"file": d.metadata.get('source'), "page": p})
                seen.add(p)

        return {"answer": greeting + response.content, "sources": sources[:3]}

# if __name__ == "__main__":
#     service = RagService()
#     test_entities = {
#         "device": "Корректировочная станция Док ЭРИС-400",
#         "issue": "Каковы условия транспортировки и хранения станции зимой?"
#     }
#     result = service.resolve_answer(test_entities, mood="negative")
#     print("\n" + "="*60 + f"\nОТВЕТ:\n{result['answer']}\n" + "="*60)