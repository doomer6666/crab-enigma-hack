import imaplib
import smtplib
import email
from email.header import decode_header
from email.mime.text import MIMEText
from django.conf import settings


class EmailService:
    def __init__(self):
        self.imap_server = "imap.gmail.com"  # Или settings.EMAIL_HOST_IMAP
        self.smtp_server = "smtp.gmail.com"
        self.email_user = settings.EMAIL_HOST_USER
        self.email_pass = settings.EMAIL_HOST_PASSWORD

    def _get_decoded_header(self, header_value):
        """Декодирует тему и имя отправителя (например из =?UTF-8?B?...)"""
        if not header_value:
            return ""
        decoded_list = decode_header(header_value)
        default_charset = "utf-8"
        text_parts = []
        for bytes_part, charset in decoded_list:
            if isinstance(bytes_part, bytes):
                try:
                    text_parts.append(bytes_part.decode(charset or default_charset))
                except LookupError:
                    text_parts.append(bytes_part.decode(default_charset, errors="replace"))
            else:
                text_parts.append(str(bytes_part))
        return "".join(text_parts)

    def _get_email_body(self, msg):
        """Извлекает текст письма из структуры multipart"""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))

                # Пропускаем вложения, берем только текст
                if "attachment" not in content_disposition:
                    if content_type == "text/plain":
                        try:
                            body = part.get_payload(decode=True).decode()
                        except:
                            pass
                        break  # Если нашли text/plain, хватит (html пока игнорим для простоты)
        else:
            # Не multipart, обычный текст
            try:
                body = msg.get_payload(decode=True).decode()
            except:
                pass
        return body

    def fetch_unseen_emails(self):
        """Забирает непрочитанные письма, возвращает список словарей"""
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_user, self.email_pass)
            mail.select("inbox")

            # Ищем только НЕПРОЧИТАННЫЕ письма
            status, messages = mail.search(None, "UNSEEN")
            email_ids = messages[0].split()

            results = []

            for e_id in email_ids:
                _, msg_data = mail.fetch(e_id, "(RFC822)")
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])

                        subject = self._get_decoded_header(msg.get("Subject"))
                        from_header = self._get_decoded_header(msg.get("From"))

                        # Парсим Email и Имя из строки "Ivanov <ivanov@mail.ru>"
                        if "<" in from_header:
                            sender_name = from_header.split("<")[0].strip()
                            sender_email = from_header.split("<")[1].strip(">")
                        else:
                            sender_name = ""
                            sender_email = from_header.strip()

                        body = self._get_email_body(msg)

                        results.append({
                            "subject": subject,
                            "sender_email": sender_email,
                            "sender_name": sender_name,
                            "body": body
                        })

            mail.close()
            mail.logout()
            return results

        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []

    def send_reply(self, to_email, subject, text):
        """Отправка ответа"""
        try:
            msg = MIMEText(text)
            msg["Subject"] = f"Re: {subject}"
            msg["From"] = self.email_user
            msg["To"] = to_email

            with smtplib.SMTP(self.smtp_server, 587) as server:
                server.starttls()
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False