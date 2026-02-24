from smtp_client import SMTPClient
from imap_client import IMAPClient

EMAIL = "nsert-email-here"
PASSWORD = "insert-password-here"

smtp = SMTPClient(EMAIL, PASSWORD)
smtp.send("tolikslonov5555@gmail.com", "Hello", "Hackathon test") # таргет-почта, заголовок, текст письма

imap = IMAPClient(EMAIL, PASSWORD)
print(imap.get_latest())
