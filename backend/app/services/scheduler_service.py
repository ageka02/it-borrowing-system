import logging
from datetime import date, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.models import BorrowTransaction, BorrowStatus, BorrowDetail
from app.services.email_service import send_reminder_email, send_overdue_email

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()


def check_overdue_and_send_reminders():
    """
    Daily job to:
    1. Check BORROWED transactions with return_date tomorrow -> send reminder
    2. Check BORROWED transactions with return_date today -> send reminder
    3. Check BORROWED transactions with return_date passed -> mark OVERDUE + send email
    """
    logger.info("Running daily overdue/reminder check...")
    db = SessionLocal()

    try:
        today = date.today()
        tomorrow = today + timedelta(days=1)

        # Get all active (BORROWED) transactions
        active_transactions = db.query(BorrowTransaction).filter(
            BorrowTransaction.status == BorrowStatus.BORROWED
        ).all()

        reminder_count = 0
        overdue_count = 0

        for txn in active_transactions:
            # Build items list for email
            items_list = []
            for detail in txn.details:
                if detail.item:
                    items_list.append({
                        "name": detail.item.item_name,
                        "quantity": detail.quantity,
                    })

            employee = txn.employee
            if not employee:
                logger.warning(f"Transaction {txn.id}: employee not found for NIK {txn.nik}")
                continue

            # Case 1: Return date is tomorrow - send reminder
            if txn.return_date == tomorrow:
                logger.info(
                    f"Transaction {txn.id}: return due tomorrow, sending reminder to {employee.email}"
                )
                send_reminder_email(
                    employee_email=employee.email,
                    employee_name=employee.name,
                    items=items_list,
                    return_date=txn.return_date,
                )
                reminder_count += 1

            # Case 2: Return date is today - send reminder
            elif txn.return_date == today:
                logger.info(
                    f"Transaction {txn.id}: return due today, sending reminder to {employee.email}"
                )
                send_reminder_email(
                    employee_email=employee.email,
                    employee_name=employee.name,
                    items=items_list,
                    return_date=txn.return_date,
                )
                reminder_count += 1

            # Case 3: Return date has passed - mark OVERDUE + send email
            elif txn.return_date < today:
                days_overdue = (today - txn.return_date).days
                logger.info(
                    f"Transaction {txn.id}: {days_overdue} day(s) overdue, "
                    f"updating status and notifying {employee.email}"
                )

                txn.status = BorrowStatus.OVERDUE

                send_overdue_email(
                    employee_email=employee.email,
                    employee_name=employee.name,
                    items=items_list,
                    return_date=txn.return_date,
                    days_overdue=days_overdue,
                )
                overdue_count += 1

        db.commit()
        logger.info(
            f"Daily check complete: {reminder_count} reminder(s) sent, "
            f"{overdue_count} transaction(s) marked overdue."
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Error in overdue checker: {e}")
    finally:
        db.close()


def start_overdue_checker():
    """Start the APScheduler background job."""
    # Run daily at 08:00 AM
    scheduler.add_job(
        check_overdue_and_send_reminders,
        trigger=CronTrigger(hour=8, minute=0),
        id="overdue_checker",
        name="Daily Overdue & Reminder Checker",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: overdue checker running daily at 08:00")


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
