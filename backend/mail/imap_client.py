import imaplib
import email


class IMAPClient:
    def __init__(self, email_addr, password):
        self.email = email_addr
        self.password = password

    def get_latest(self):
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(self.email, self.password)

        mail.select("inbox")
        _, data = mail.search(None, "ALL")

        ids = data[0].split()
        latest = ids[-1]

        _, msg_data = mail.fetch(latest, "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])

        return msg["Subject"], msg["From"]
