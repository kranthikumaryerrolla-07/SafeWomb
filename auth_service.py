import bcrypt
from typing import Optional, Dict, Tuple
from db_config import supabase

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    @staticmethod
    def register_user(
        email: str,
        phone: str,
        country_code: str,
        full_name: str,
        password: str,
        role: str
    ) -> Tuple[bool, str, Optional[Dict]]:
        """
        Register a new user

        Returns: (success, message, user_data)
        """
        if role not in ['patient', 'partner', 'asha_worker']:
            return False, "Invalid role. Must be 'patient', 'partner', or 'asha_worker'", None

        full_phone = f"{country_code}{phone}"
        password_hash = AuthService.hash_password(password)

        try:
            response = supabase.table('users').insert({
                'email': email,
                'phone': full_phone,
                'country_code': country_code,
                'full_name': full_name,
                'password_hash': password_hash,
                'role': role
            }).execute()

            if response.data:
                user = response.data[0]

                if role == 'patient':
                    profile_response = supabase.table('patient_profiles').insert({
                        'user_id': user['id']
                    }).execute()

                return True, "Registration successful!", user
            else:
                return False, "Registration failed", None

        except Exception as e:
            error_msg = str(e)
            if 'duplicate key' in error_msg.lower():
                if 'email' in error_msg.lower():
                    return False, "Email already registered", None
                elif 'phone' in error_msg.lower():
                    return False, "Phone number already registered", None
            return False, f"Registration error: {error_msg}", None

    @staticmethod
    def login(email: str, password: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Authenticate user

        Returns: (success, message, user_data)
        """
        try:
            response = supabase.table('users').select('*').eq('email', email).eq('is_active', True).execute()

            if not response.data:
                return False, "Invalid email or password", None

            user = response.data[0]

            if not AuthService.verify_password(password, user['password_hash']):
                return False, "Invalid email or password", None

            supabase.table('users').update({
                'last_login': 'now()'
            }).eq('id', user['id']).execute()

            user_data = {
                'id': user['id'],
                'email': user['email'],
                'phone': user['phone'],
                'full_name': user['full_name'],
                'role': user['role']
            }

            return True, "Login successful!", user_data

        except Exception as e:
            return False, f"Login error: {str(e)}", None

    @staticmethod
    def get_user_profile(user_id: str, role: str) -> Optional[Dict]:
        """Get complete user profile based on role"""
        try:
            user_response = supabase.table('users').select('*').eq('id', user_id).execute()

            if not user_response.data:
                return None

            user = user_response.data[0]

            if role == 'patient':
                profile_response = supabase.table('patient_profiles').select('*').eq('user_id', user_id).execute()
                if profile_response.data:
                    user['profile'] = profile_response.data[0]

            return user

        except Exception as e:
            print(f"Error fetching profile: {e}")
            return None

    @staticmethod
    def update_patient_profile(user_id: str, profile_data: Dict) -> Tuple[bool, str]:
        """Update patient profile information"""
        try:
            response = supabase.table('patient_profiles').update(
                profile_data
            ).eq('user_id', user_id).execute()

            if response.data:
                return True, "Profile updated successfully"
            return False, "Profile update failed"

        except Exception as e:
            return False, f"Update error: {str(e)}"

    @staticmethod
    def link_partner_to_patient(patient_id: str, partner_id: str) -> Tuple[bool, str]:
        """Link a partner account to a patient"""
        try:
            response = supabase.table('patient_profiles').update({
                'partner_id': partner_id
            }).eq('user_id', patient_id).execute()

            if response.data:
                return True, "Partner linked successfully"
            return False, "Failed to link partner"

        except Exception as e:
            return False, f"Link error: {str(e)}"

    @staticmethod
    def assign_asha_worker(patient_id: str, asha_worker_id: str) -> Tuple[bool, str]:
        """Assign ASHA worker to a patient"""
        try:
            response = supabase.table('patient_profiles').update({
                'asha_worker_id': asha_worker_id
            }).eq('user_id', patient_id).execute()

            if response.data:
                return True, "ASHA worker assigned successfully"
            return False, "Failed to assign ASHA worker"

        except Exception as e:
            return False, f"Assignment error: {str(e)}"
