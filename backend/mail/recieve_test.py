import time
import imaplib
import email
from email.header import decode_header

EMAIL = "insert-email-here"
PASSWORD = "insert-password-here"

last_id = None

while True:
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL, PASSWORD)
    mail.select("inbox")

    _, data = mail.search(None, "ALL")
    ids = data[0].split()

    if ids:
        latest = ids[-1]

        if latest != last_id:
            _, msg_data = mail.fetch(latest, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])

            subject, encoding = decode_header(msg["Subject"])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding or "utf-8")

            from_ = msg.get("From")
            date_ = msg.get("Date")

            print("Новое письмо:")
            print("From:", from_)
            print("Subject:", subject)
            print("Date:", date_)

            if msg.is_multipart():
                parts = []
                for part in msg.walk():
                    if part.get_content_type() == "text/plain" and not part.get("Content-Disposition"):
                        charset = part.get_content_charset() or "utf-8"
                        parts.append(part.get_payload(decode=True).decode(charset, errors="ignore"))
                body = "\n".join(parts)
            else:
                charset = msg.get_content_charset() or "utf-8"
                body = msg.get_payload(decode=True).decode(charset, errors="ignore")

            print("Body:", body)
            print("-" * 50)

            last_id = latest

    mail.logout()
    time.sleep(5)
