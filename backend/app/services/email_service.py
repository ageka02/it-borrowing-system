import smtplib
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from typing import List, Dict

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Setup Jinja2 template environment
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html"]),
)


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email via SMTP.
    Returns True on success, False on failure.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP not configured. Would send to {to_email}: {subject}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to_email

        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())

        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_reminder_email(
    employee_email: str,
    employee_name: str,
    items: List[Dict],
    return_date: date,
) -> bool:
    """
    Send a reminder email about upcoming return date.
    items: list of {"name": str, "quantity": int}
    """
    try:
        template = jinja_env.get_template("reminder_email.html")
        html_body = template.render(
            employee_name=employee_name,
            items=items,
            return_date=return_date.isoformat(),
            app_url=settings.APP_URL,
        )

        subject = f"[Reminder] IT Equipment Return Due: {return_date.isoformat()}"
        return _send_email(employee_email, subject, html_body)

    except Exception as e:
        logger.error(f"Failed to render/send reminder email: {e}")
        return False


def send_overdue_email(
    employee_email: str,
    employee_name: str,
    items: List[Dict],
    return_date: date,
    days_overdue: int,
) -> bool:
    """
    Send an overdue notice email.
    items: list of {"name": str, "quantity": int}
    """
    try:
        template = jinja_env.get_template("overdue_email.html")
        html_body = template.render(
            employee_name=employee_name,
            items=items,
            return_date=return_date.isoformat(),
            days_overdue=days_overdue,
            app_url=settings.APP_URL,
        )

        subject = f"[OVERDUE] IT Equipment Return Overdue by {days_overdue} Day(s)"
        return _send_email(employee_email, subject, html_body)

    except Exception as e:
        logger.error(f"Failed to render/send overdue email: {e}")
        return False
