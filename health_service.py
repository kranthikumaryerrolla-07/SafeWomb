from typing import Dict, List, Optional, Tuple
from db_config import supabase
from datetime import datetime

class HealthService:
    @staticmethod
    def save_health_record(
        patient_id: str,
        recorded_by: str,
        lab_values: Dict,
        risk_level: str,
        recommendations: Dict,
        notes: str = ""
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Save health assessment to database

        Args:
            patient_id: Patient profile ID
            recorded_by: User ID who recorded the data
            lab_values: Dictionary with lab test values
            risk_level: Risk assessment (LOW, MEDIUM, HIGH)
            recommendations: JSON recommendations
            notes: Additional notes

        Returns: (success, message, record_id)
        """
        try:
            record_data = {
                'patient_id': patient_id,
                'recorded_by': recorded_by,
                'hemoglobin': lab_values.get('Hemoglobin'),
                'blood_sugar': lab_values.get('BloodSugar'),
                'systolic_bp': lab_values.get('SystolicBP'),
                'diastolic_bp': lab_values.get('DiastolicBP'),
                'tsh': lab_values.get('TSH'),
                'amniotic_fluid': lab_values.get('AmnioticFluid'),
                'risk_level': risk_level,
                'recommendations': recommendations,
                'notes': notes
            }

            response = supabase.table('health_records').insert(record_data).execute()

            if response.data:
                record_id = response.data[0]['id']
                return True, "Health record saved successfully", record_id
            return False, "Failed to save health record", None

        except Exception as e:
            return False, f"Error saving record: {str(e)}", None

    @staticmethod
    def get_patient_records(patient_id: str, limit: int = 10) -> List[Dict]:
        """Get recent health records for a patient"""
        try:
            response = supabase.table('health_records').select('*').eq(
                'patient_id', patient_id
            ).order('created_at', desc=True).limit(limit).execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Error fetching records: {e}")
            return []

    @staticmethod
    def get_patient_profile_by_user_id(user_id: str) -> Optional[Dict]:
        """Get patient profile by user ID"""
        try:
            response = supabase.table('patient_profiles').select('*').eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error fetching patient profile: {e}")
            return None

    @staticmethod
    def save_notification(
        user_id: str,
        health_record_id: str,
        notification_type: str,
        message: str
    ) -> Tuple[bool, str]:
        """Save notification record"""
        try:
            notification_data = {
                'user_id': user_id,
                'health_record_id': health_record_id,
                'notification_type': notification_type,
                'message': message,
                'status': 'sent'
            }

            response = supabase.table('notifications').insert(notification_data).execute()

            if response.data:
                return True, "Notification saved"
            return False, "Failed to save notification"

        except Exception as e:
            return False, f"Error: {str(e)}"

    @staticmethod
    def get_user_notifications(user_id: str, unread_only: bool = False) -> List[Dict]:
        """Get notifications for a user"""
        try:
            query = supabase.table('notifications').select('*').eq('user_id', user_id)

            if unread_only:
                query = query.is_('read_at', 'null')

            response = query.order('sent_at', desc=True).limit(50).execute()
            return response.data if response.data else []

        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return []

    @staticmethod
    def mark_notification_read(notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            response = supabase.table('notifications').update({
                'read_at': datetime.utcnow().isoformat(),
                'status': 'read'
            }).eq('id', notification_id).execute()

            return bool(response.data)

        except Exception as e:
            print(f"Error marking notification read: {e}")
            return False

    @staticmethod
    def get_asha_worker_patients(asha_worker_id: str) -> List[Dict]:
        """Get all patients assigned to an ASHA worker"""
        try:
            response = supabase.table('patient_profiles').select(
                '*, users!patient_profiles_user_id_fkey(*)'
            ).eq('asha_worker_id', asha_worker_id).execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Error fetching patients: {e}")
            return []

    @staticmethod
    def get_partner_patient(partner_id: str) -> Optional[Dict]:
        """Get patient linked to a partner"""
        try:
            response = supabase.table('patient_profiles').select(
                '*, users!patient_profiles_user_id_fkey(*)'
            ).eq('partner_id', partner_id).execute()

            return response.data[0] if response.data else None

        except Exception as e:
            print(f"Error fetching partner's patient: {e}")
            return None
