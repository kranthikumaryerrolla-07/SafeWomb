"""
Notification Dispatcher - Sends alerts based on risk levels
Does not modify backend logic - only receives output from engine.py
"""

from datetime import datetime, timedelta


def dispatch_alert(risk_level, patient_data, missing_tests=None):
    """
    Dispatch notification based on risk level from engine.py

    Args:
        risk_level: str - "LOW", "MEDIUM", "HIGH", or "INSUFFICIENT_DATA"
        patient_data: dict - Patient lab values used in prediction
        missing_tests: list - Tests that were not provided

    Returns:
        dict: Notification details including channels, recipients, urgency
    """

    if risk_level == "HIGH":
        return dispatch_high_risk_alert(patient_data)
    elif risk_level == "MEDIUM":
        return dispatch_medium_risk_alert(patient_data)
    elif risk_level == "LOW":
        return dispatch_low_risk_alert(patient_data)
    elif risk_level == "INSUFFICIENT_DATA":
        return dispatch_data_reminder(missing_tests)
    else:
        return {"status": "no_alert", "message": "Unknown risk level"}


def dispatch_high_risk_alert(patient_data):
    """
    HIGH RISK: Appointment within 12 hours
    Notify mother, partner, and PHC immediately
    """
    alert_time = datetime.now()
    appointment_deadline = alert_time + timedelta(hours=12)

    notification = {
        "risk_level": "HIGH",
        "urgency": "CRITICAL",
        "appointment_deadline": appointment_deadline.isoformat(),
        "channels": ["phone_call", "push_notification", "sms", "email"],
        "recipients": {
            "mother": {
                "message": "🚨 MAMA! This is urgent! I need help within 12 hours. Please call your doctor or go to ER NOW! I love you! ❤️",
                "requires_acknowledgment": True,
                "reminder_interval_minutes": 15
            },
            "partner": {
                "message": "🚨 EMERGENCY! Mama needs medical help within 12 hours! Call her NOW and help her get to a doctor! We need you!",
                "requires_acknowledgment": True,
                "reminder_interval_minutes": 5
            },
            "phc": {
                "message": f"🚨 HIGH RISK ALERT: Patient requires medical evaluation within 12 hours. Lab values: {patient_data}. Contact ASAP.",
                "requires_acknowledgment": True,
                "reminder_interval_minutes": 30
            }
        },
        "calendar_event": {
            "title": "🚨 URGENT Baby Checkup - Within 12 Hours",
            "color": "red",
            "allow_reschedule": False,
            "auto_escalate": True
        },
        "escalation": {
            "enabled": True,
            "escalate_after_minutes": 60,
            "escalation_action": "dispatch_emergency_contact"
        }
    }

    return notification


def dispatch_medium_risk_alert(patient_data):
    """
    MEDIUM RISK: Appointment within 48 hours
    Notify mother and partner with reminders
    """
    alert_time = datetime.now()
    appointment_deadline = alert_time + timedelta(hours=48)

    notification = {
        "risk_level": "MEDIUM",
        "urgency": "HIGH",
        "appointment_deadline": appointment_deadline.isoformat(),
        "channels": ["push_notification", "sms", "email"],
        "recipients": {
            "mother": {
                "message": "Hi Mama! I'm feeling some changes and want to make sure we're both okay. Let's visit the doctor in the next 2 days. Love you! 💙",
                "requires_acknowledgment": True,
                "reminder_intervals_hours": [6, 24, 36]
            },
            "partner": {
                "message": "Hi! Mama needs a checkup within 48 hours. Can you help her schedule it? We're counting on you! ❤️",
                "requires_acknowledgment": False,
                "reminder_intervals_hours": [24]
            },
            "phc": {
                "message": f"MEDIUM RISK ALERT: Patient requires checkup within 48 hours. Lab values: {patient_data}.",
                "requires_acknowledgment": False
            }
        },
        "calendar_event": {
            "title": "Baby Checkup Needed - Schedule Within 48 Hours",
            "color": "orange",
            "allow_reschedule": False,
            "auto_escalate": True
        },
        "escalation": {
            "enabled": True,
            "escalate_after_hours": 36,
            "escalation_action": "upgrade_to_high_risk"
        }
    }

    return notification


def dispatch_low_risk_alert(patient_data):
    """
    LOW RISK: Routine checkup, positive reinforcement
    """
    notification = {
        "risk_level": "LOW",
        "urgency": "ROUTINE",
        "channels": ["push_notification"],
        "recipients": {
            "mother": {
                "message": "Great news, Mama! Everything looks good! Keep taking care of us. You're doing amazing! 💙✨",
                "requires_acknowledgment": False
            }
        },
        "calendar_event": None,
        "escalation": {
            "enabled": False
        }
    }

    return notification


def dispatch_data_reminder(missing_tests):
    """
    INSUFFICIENT DATA: Remind about missing lab tests
    """
    missing_list = ", ".join(missing_tests) if missing_tests else "some tests"

    notification = {
        "risk_level": "INSUFFICIENT_DATA",
        "urgency": "INFO",
        "channels": ["push_notification", "email"],
        "recipients": {
            "mother": {
                "message": f"Mama, I need more information! We're missing: {missing_list}. Please get these tests done so I can help you better! 💙",
                "requires_acknowledgment": False
            }
        },
        "calendar_event": {
            "title": f"Complete Lab Tests: {missing_list}",
            "color": "blue",
            "allow_reschedule": True
        },
        "escalation": {
            "enabled": False
        }
    }

    return notification


def send_notification(notification_data):
    """
    Execute the actual sending of notifications
    In production: integrate with Twilio (SMS), SendGrid (email),
    Firebase Cloud Messaging (push), Vonage (phone calls)

    Args:
        notification_data: dict from dispatch_alert()

    Returns:
        dict: Delivery status for each channel
    """
    # Placeholder: In production, implement actual notification sending

    delivery_status = {
        "sent_at": datetime.now().isoformat(),
        "risk_level": notification_data.get("risk_level"),
        "channels_used": notification_data.get("channels", []),
        "recipients_notified": list(notification_data.get("recipients", {}).keys()),
        "status": "queued"  # In production: "sent", "delivered", "failed"
    }

    return delivery_status
