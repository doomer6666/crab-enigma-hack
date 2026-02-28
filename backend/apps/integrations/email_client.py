import imaplib
import smtplib
import email
from email.header import decode_header
from email.mime.text import MIMEText
from django.conf import settings


class EmailService:
    def __init__(self):
        self.imap_server = "imap.gmail.com"
        self.smtp_server = "smtp.gmail.com"
        self.email_user = settings.EMAIL_HOST_USER
        self.email_pass = settings.EMAIL_HOST_PASSWORD

        # Проверка настроек
        if not self.email_user or not self.email_pass:
            print("❌ EMAIL CREDENTIALS MISSING! Check .env file.")

    def _get_decoded_header(self, header_value):
        """Декодирует тему и имя отправителя"""
        if not header_value:
            return ""
        try:
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
        except Exception as e:
            print(f"Error decoding header: {e}")
            return str(header_value)

    def _get_email_body(self, msg):
        """Извлекает текст письма"""
        body = ""
        try:
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))

                    if "attachment" not in content_disposition:
                        if content_type == "text/plain":
                            try:
                                body = part.get_payload(decode=True).decode()
                            except:
                                pass
                            break
            else:
                try:
                    body = msg.get_payload(decode=True).decode()
                except:
                    pass
            return body
        except Exception as e:
            print(f"Error extracting body: {e}")
            return ""

    def fetch_unseen_emails(self):
        """Забирает непрочитанные письма"""
        print(f"🔌 Connecting to IMAP {self.imap_server} as {self.email_user}...")

        try:
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_user, self.email_pass)
            print("✅ Login successful.")

            mail.select("inbox")

            # Ищем непрочитанные
            status, messages = mail.search(None, "UNSEEN")
            if status != "OK":
                print(f"❌ Search failed. Status: {status}")
                return []

            email_ids = messages[0].split()
            count = len(email_ids)

            if count == 0:
                print("📭 No new (UNSEEN) emails found.")
                return []

            print(f"📩 Found {count} new emails. Processing...")

            results = []

            for e_id in email_ids:
                try:
                    e_id_str = e_id.decode() if isinstance(e_id, bytes) else str(e_id)
                    print(f"--- Fetching email ID: {e_id_str} ---")

                    _, msg_data = mail.fetch(e_id, "(RFC822)")
                    for response_part in msg_data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])

                            subject = self._get_decoded_header(msg.get("Subject"))
                            from_header = self._get_decoded_header(msg.get("From"))

                            print(f"   Subject: {subject}")
                            print(f"   From: {from_header}")

                            # Парсим отправителя
                            if "<" in from_header:
                                sender_name = from_header.split("<")[0].strip()
                                sender_email = from_header.split("<")[1].strip(">")
                            else:
                                sender_name = ""
                                sender_email = from_header.strip()

                            body = self._get_email_body(msg)

                            if not body:
                                print("   ⚠️ Body is empty!")
                            else:
                                print(f"   Body extracted (len: {len(body)})")

                            results.append({
                                "subject": subject,
                                "sender_email": sender_email,
                                "sender_name": sender_name,
                                "body": body
                            })
                except Exception as inner_e:
                    print(f"❌ Error processing specific email {e_id}: {inner_e}")
                    continue

            mail.close()
            mail.logout()
            print(f"✅ Finished. Fetched {len(results)} emails.")
            return results

        except Exception as e:
            print(f"🔥 CRITICAL EMAIL ERROR: {e}")
            return []

    def send_reply(self, to_email, subject, text):
        print(f"📤 Sending reply to {to_email}...")
        try:
            msg = MIMEText(text)
            msg["Subject"] = f"Re: {subject}"
            msg["From"] = self.email_user
            msg["To"] = to_email

            with smtplib.SMTP(self.smtp_server, 587) as server:
                server.starttls()
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)

            print("✅ Email sent.")
            return True
        except Exception as e:
            print(f"❌ Error sending email: {e}")
            return False