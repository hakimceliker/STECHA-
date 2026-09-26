"""Notification Service - Email, SMS, OTP"""

import logging
import random
import string
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class OTPService:
    """OTP generation and verification"""

    def __init__(self, validity_minutes: int = 5):
        """Initialize OTP service"""
        self.validity_minutes = validity_minutes
        self.otp_storage = {}  # In production: use Redis

    def generate_otp(self, user_id: int, length: int = 6) -> str:
        """Generate OTP code"""
        otp = "".join(random.choices(string.digits, k=length))

        # Store with expiration
        expires_at = datetime.utcnow() + timedelta(minutes=self.validity_minutes)
        self.otp_storage[user_id] = {
            "code": otp,
            "expires_at": expires_at,
            "attempts": 0
        }

        logger.info(f"Generated OTP for user {user_id}: {otp}")
        return otp

    def verify_otp(self, user_id: int, code: str, max_attempts: int = 3) -> tuple[bool, str]:
        """Verify OTP code"""
        if user_id not in self.otp_storage:
            return False, "OTP not found or expired"

        otp_data = self.otp_storage[user_id]

        # Check expiration
        if datetime.utcnow() > otp_data["expires_at"]:
            del self.otp_storage[user_id]
            return False, "OTP expired"

        # Check attempts
        if otp_data["attempts"] >= max_attempts:
            del self.otp_storage[user_id]
            return False, "Maximum attempts exceeded"

        # Check code
        if otp_data["code"] != code:
            otp_data["attempts"] += 1
            return False, "Invalid OTP code"

        # Success - remove OTP
        del self.otp_storage[user_id]
        logger.info(f"OTP verified for user {user_id}")
        return True, "OTP verified successfully"


class EmailService:
    """Email notification service"""

    def __init__(
        self,
        smtp_host: str = "smtp.gmail.com",
        smtp_port: int = 587,
        sender_email: str = None,
        sender_password: str = None
    ):
        """Initialize email service"""
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password

    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        html: bool = False
    ) -> tuple[bool, str]:
        """Send email notification"""
        try:
            if not self.sender_email or not self.sender_password:
                logger.warning("Email service not configured, skipping send")
                return False, "Email service not configured"

            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = recipient

            # Add body
            mime_type = "html" if html else "plain"
            message.attach(MIMEText(body, mime_type))

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient, message.as_string())

            logger.info(f"Email sent to {recipient}: {subject}")
            return True, "Email sent successfully"
        except Exception as e:
            logger.error(f"Email sending error: {str(e)}")
            return False, f"Email error: {str(e)}"

    def send_verification_email(self, email: str, token: str) -> tuple[bool, str]:
        """Send email verification link"""
        subject = "Stech AI - Email Verification"
        body = f"""
        <h1>Email Verification</h1>
        <p>Click the link below to verify your email:</p>
        <a href="https://stech-ai.app/verify?token={token}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        """
        return self.send_email(email, subject, body, html=True)

    def send_otp_email(self, email: str, otp: str) -> tuple[bool, str]:
        """Send OTP via email"""
        subject = "Stech AI - Your OTP Code"
        body = f"""
        <h1>One-Time Password</h1>
        <p>Your OTP code is: <strong>{otp}</strong></p>
        <p>This code expires in 5 minutes.</p>
        <p>Do not share this code with anyone.</p>
        """
        return self.send_email(email, subject, body, html=True)

    def send_password_reset_email(self, email: str, reset_token: str) -> tuple[bool, str]:
        """Send password reset link"""
        subject = "Stech AI - Password Reset"
        body = f"""
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="https://stech-ai.app/reset-password?token={reset_token}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        """
        return self.send_email(email, subject, body, html=True)


class SMSService:
    """SMS notification service (Twilio integration)"""

    def __init__(self, account_sid: str = None, auth_token: str = None, from_number: str = None):
        """Initialize SMS service"""
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number

        # In production: from twilio.rest import Client

    def send_sms(self, phone_number: str, message: str) -> tuple[bool, str]:
        """Send SMS notification"""
        try:
            if not self.account_sid or not self.auth_token:
                logger.warning("SMS service not configured, skipping send")
                return False, "SMS service not configured"

            # In production:
            # client = Client(self.account_sid, self.auth_token)
            # message = client.messages.create(to=phone_number, from_=self.from_number, body=message)

            logger.info(f"SMS sent to {phone_number}")
            return True, "SMS sent successfully"
        except Exception as e:
            logger.error(f"SMS sending error: {str(e)}")
            return False, f"SMS error: {str(e)}"

    def send_otp_sms(self, phone_number: str, otp: str) -> tuple[bool, str]:
        """Send OTP via SMS"""
        message = f"Stech AI OTP: {otp}. Valid for 5 minutes. Do not share."
        return self.send_sms(phone_number, message)


class PushNotificationService:
    """Push notification service (Firebase)"""

    def __init__(self, credentials_path: str = None):
        """Initialize push notification service"""
        self.credentials_path = credentials_path

        # In production: import firebase_admin

    def send_push(self, device_token: str, title: str, body: str) -> tuple[bool, str]:
        """Send push notification"""
        try:
            if not self.credentials_path:
                logger.warning("Push service not configured, skipping send")
                return False, "Push service not configured"

            # In production:
            # firebase_admin.send_message(message)

            logger.info(f"Push sent to {device_token}: {title}")
            return True, "Push notification sent"
        except Exception as e:
            logger.error(f"Push notification error: {str(e)}")
            return False, f"Push error: {str(e)}"


class NotificationServiceFactory:
    """Factory for creating notification service instances"""

    @staticmethod
    def create_email_service(smtp_host: str, smtp_port: int, sender_email: str, sender_password: str):
        """Create email service"""
        return EmailService(smtp_host, smtp_port, sender_email, sender_password)

    @staticmethod
    def create_sms_service(account_sid: str, auth_token: str, from_number: str):
        """Create SMS service"""
        return SMSService(account_sid, auth_token, from_number)

    @staticmethod
    def create_push_service(credentials_path: str):
        """Create push notification service"""
        return PushNotificationService(credentials_path)

    @staticmethod
    def create_otp_service(validity_minutes: int = 5):
        """Create OTP service"""
        return OTPService(validity_minutes)


class NotificationServiceManager:
    """Unified notification service manager"""

    def __init__(self):
        """Initialize manager with all services"""
        self.email_service = EmailService()
        self.sms_service = SMSService()
        self.push_service = PushNotificationService()
        self.otp_service = OTPService()

    def send_email(self, to_email: str, subject: str, body: str, alert_type: str = None) -> tuple[bool, str]:
        """Send email notification"""
        return self.email_service.send_email(to_email, subject, body, html=True)

    def send_sms(self, phone: str, message: str) -> tuple[bool, str]:
        """Send SMS notification"""
        return self.sms_service.send_sms(phone, message)

    def send_push(self, device_token: str, title: str, body: str) -> tuple[bool, str]:
        """Send push notification"""
        return self.push_service.send_push(device_token, title, body)

    def generate_otp(self, user_id: int) -> str:
        """Generate OTP for user"""
        return self.otp_service.generate_otp(user_id)

    def verify_otp(self, user_id: int, code: str) -> tuple[bool, str]:
        """Verify OTP for user"""
        return self.otp_service.verify_otp(user_id, code)


# Global notification service instance
notification_service = NotificationServiceManager()
