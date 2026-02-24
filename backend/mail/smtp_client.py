import smtplib
from email.mime.text import MIMEText


class SMTPClient:
    def __init__(self, email, password):
        self.email = email
        self.password = password

    def send(self, to, subject, text):
        msg = MIMEText(text)
        msg["Subject"] = subject
        msg["From"] = self.email
        msg["To"] = to

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(self.email, self.password)
            server.send_message(msg)
