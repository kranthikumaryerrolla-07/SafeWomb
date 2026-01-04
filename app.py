import streamlit as st
from model_loader import load_model
from engine import run_maternal_risk_engine
from ocr_service import parse_uploaded_file
from voice_service import text_to_structured_data
from notification_service import dispatch_alert, send_notification
from auth_service import AuthService
from health_service import HealthService

model = load_model()

st.set_page_config(page_title="Maternal Health Monitor", page_icon="🤰", layout="wide")

if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
    st.session_state.user = None
    st.session_state.inputs = {}

def show_login_page():
    """Display login and registration interface"""
    st.title("🤰 Maternal Health Monitoring System")

    tab1, tab2 = st.tabs(["Login", "Register"])

    with tab1:
        st.subheader("Login to Your Account")

        with st.form("login_form"):
            email = st.text_input("Email Address")
            password = st.text_input("Password", type="password")
            submit = st.form_submit_button("Login", type="primary", use_container_width=True)

            if submit:
                if not email or not password:
                    st.error("Please fill in all fields")
                else:
                    success, message, user_data = AuthService.login(email, password)

                    if success:
                        st.session_state.authenticated = True
                        st.session_state.user = user_data
                        st.success(message)
                        st.rerun()
                    else:
                        st.error(message)

    with tab2:
        st.subheader("Create New Account")

        with st.form("register_form"):
            col1, col2 = st.columns(2)

            with col1:
                full_name = st.text_input("Full Name")
                email_reg = st.text_input("Email Address", key="reg_email")
                password_reg = st.text_input("Password", type="password", key="reg_pass")
                password_confirm = st.text_input("Confirm Password", type="password")

            with col2:
                country_code = st.selectbox("Country Code", ["+91", "+1", "+44", "+61", "+971"], index=0)
                phone = st.text_input("Phone Number (without country code)")
                role = st.selectbox("Account Type", ["patient", "partner", "asha_worker"],
                                  format_func=lambda x: {
                                      "patient": "Patient",
                                      "partner": "Partner (Husband/Family)",
                                      "asha_worker": "ASHA Worker"
                                  }[x])

            submit_reg = st.form_submit_button("Create Account", type="primary", use_container_width=True)

            if submit_reg:
                if not all([full_name, email_reg, password_reg, password_confirm, phone]):
                    st.error("Please fill in all fields")
                elif password_reg != password_confirm:
                    st.error("Passwords do not match")
                elif len(password_reg) < 6:
                    st.error("Password must be at least 6 characters")
                elif not phone.isdigit():
                    st.error("Phone number must contain only digits")
                else:
                    success, message, user_data = AuthService.register_user(
                        email=email_reg,
                        phone=phone,
                        country_code=country_code,
                        full_name=full_name,
                        password=password_reg,
                        role=role
                    )

                    if success:
                        st.success(message)
                        st.info("Please login with your credentials")
                    else:
                        st.error(message)

def show_main_app():
    """Display main application after login"""
    user = st.session_state.user

    st.sidebar.title(f"Welcome, {user['full_name']}")
    st.sidebar.write(f"**Role:** {user['role'].replace('_', ' ').title()}")
    st.sidebar.write(f"**Email:** {user['email']}")

    if st.sidebar.button("Logout", type="secondary"):
        st.session_state.authenticated = False
        st.session_state.user = None
        st.session_state.inputs = {}
        st.rerun()

    st.title("Maternal Risk Prediction AI")

    if user['role'] == 'patient':
        show_patient_dashboard()
    elif user['role'] == 'partner':
        show_partner_dashboard()
    elif user['role'] == 'asha_worker':
        show_asha_dashboard()

def show_patient_dashboard():
    """Dashboard for patient users"""
    user = st.session_state.user

    st.header("Your Health Dashboard")

    tabs = st.tabs(["New Assessment", "Health Records", "Notifications", "Profile"])

    with tabs[0]:
        show_assessment_form()

    with tabs[1]:
        show_health_records()

    with tabs[2]:
        show_notifications()

    with tabs[3]:
        show_profile_editor()

def show_partner_dashboard():
    """Dashboard for partner users"""
    st.header("Partner Dashboard")

    patient = HealthService.get_partner_patient(st.session_state.user['id'])

    if patient:
        st.success(f"Linked to patient: {patient['users']['full_name']}")
        show_health_records(patient['id'])
    else:
        st.info("No patient linked to your account. Please contact your healthcare provider.")

def show_asha_dashboard():
    """Dashboard for ASHA worker users"""
    st.header("ASHA Worker Dashboard")

    patients = HealthService.get_asha_worker_patients(st.session_state.user['id'])

    if patients:
        st.success(f"Managing {len(patients)} patients")

        selected_patient = st.selectbox(
            "Select Patient",
            options=patients,
            format_func=lambda p: f"{p['users']['full_name']} - {p['users']['phone']}"
        )

        if selected_patient:
            st.subheader(f"Patient: {selected_patient['users']['full_name']}")

            tabs = st.tabs(["New Assessment", "Health Records"])

            with tabs[0]:
                show_assessment_form(patient_profile_id=selected_patient['id'])

            with tabs[1]:
                show_health_records(selected_patient['id'])
    else:
        st.info("No patients assigned yet.")

def show_assessment_form(patient_profile_id=None):
    """Risk assessment form"""
    if 'inputs' not in st.session_state:
        st.session_state.inputs = {}

    st.subheader("Upload Lab Report")
    uploaded_file = st.file_uploader("Upload medical report (Image/PDF)", type=["png", "jpg", "jpeg", "pdf"])

    if st.button("Extract from Upload"):
        if uploaded_file:
            extracted_values = parse_uploaded_file(uploaded_file)
            if extracted_values:
                st.session_state.inputs.update(extracted_values)
                st.success(f"Extracted {len(extracted_values)} values from upload!")
                st.json(extracted_values)
            else:
                st.info("OCR service integration pending. Manual entry available below.")
        else:
            st.warning("Please upload a file first")

    st.divider()

    st.subheader("Voice Input")
    voice_text = st.text_area("Speak or type your symptoms and test results:",
                              placeholder="Example: My hemoglobin is 11.5 and blood sugar is 105.")

    if st.button("Parse Voice Input"):
        if voice_text:
            parsed_data = text_to_structured_data(voice_text)
            if parsed_data:
                st.session_state.inputs.update(parsed_data)
                st.success("Voice input parsed!")
                st.json(parsed_data)
            else:
                st.info("Voice parser integration pending. Manual entry available below.")
        else:
            st.warning("Please provide voice input or text first")

    st.divider()

    st.subheader("Manual Entry")
    inputs = st.session_state.inputs.copy()

    col1, col2 = st.columns(2)

    with col1:
        hb = st.number_input("Hemoglobin (g/dL)", value=float(inputs.get("Hemoglobin", 0.0)), min_value=0.0, max_value=20.0)
        bs = st.number_input("Blood Sugar (mg/dL)", value=float(inputs.get("BloodSugar", 0.0)), min_value=0.0, max_value=500.0)
        sbp = st.number_input("Systolic BP (mmHg)", value=float(inputs.get("SystolicBP", 0.0)), min_value=0.0, max_value=300.0)

    with col2:
        dbp = st.number_input("Diastolic BP (mmHg)", value=float(inputs.get("DiastolicBP", 0.0)), min_value=0.0, max_value=200.0)
        tsh = st.number_input("TSH (mIU/L)", value=float(inputs.get("TSH", 0.0)), min_value=0.0, max_value=20.0)
        af = st.number_input("Amniotic Fluid (cm)", value=float(inputs.get("AmnioticFluid", 0.0)), min_value=0.0, max_value=30.0)

    if hb > 0:
        inputs["Hemoglobin"] = hb
    if bs > 0:
        inputs["BloodSugar"] = bs
    if sbp > 0:
        inputs["SystolicBP"] = sbp
    if dbp > 0:
        inputs["DiastolicBP"] = dbp
    if tsh > 0:
        inputs["TSH"] = tsh
    if af > 0:
        inputs["AmnioticFluid"] = af

    notes = st.text_area("Additional Notes (optional)")

    st.divider()

    col1, col2 = st.columns(2)

    with col1:
        if st.button("Predict Risk", type="primary", use_container_width=True):
            if inputs:
                result = run_maternal_risk_engine(inputs, model)
                st.session_state.prediction_result = result

                risk_level = result["final_risk"]

                if risk_level == "HIGH":
                    st.error(f"Risk Level: {risk_level}")
                elif risk_level == "MEDIUM":
                    st.warning(f"Risk Level: {risk_level}")
                elif risk_level == "LOW":
                    st.success(f"Risk Level: {risk_level}")
                else:
                    st.info(f"Status: {risk_level}")

                if result["missing_tests"]:
                    st.warning("Missing Tests: " + ", ".join(result["missing_tests"]))

                if patient_profile_id is None:
                    patient_profile = HealthService.get_patient_profile_by_user_id(st.session_state.user['id'])
                    if patient_profile:
                        patient_profile_id = patient_profile['id']

                if patient_profile_id:
                    success, message, record_id = HealthService.save_health_record(
                        patient_id=patient_profile_id,
                        recorded_by=st.session_state.user['id'],
                        lab_values=inputs,
                        risk_level=risk_level,
                        recommendations=result.get("recommendations", {}),
                        notes=notes
                    )

                    if success:
                        st.success("Health record saved to database")
                        st.session_state.last_record_id = record_id
                    else:
                        st.error(f"Failed to save record: {message}")

            else:
                st.warning("Please provide at least one lab value")

    with col2:
        if st.button("Send Alert", type="secondary", use_container_width=True):
            if 'prediction_result' in st.session_state:
                result = st.session_state.prediction_result

                notification = dispatch_alert(
                    risk_level=result["final_risk"],
                    patient_data=inputs,
                    missing_tests=result.get("missing_tests")
                )

                delivery_status = send_notification(notification)

                if 'last_record_id' in st.session_state:
                    HealthService.save_notification(
                        user_id=st.session_state.user['id'],
                        health_record_id=st.session_state.last_record_id,
                        notification_type='sms',
                        message=notification['message']
                    )

                st.success("Alert dispatched!")

                with st.expander("Notification Details"):
                    st.json(notification)
                    st.caption(f"Status: {delivery_status['status']}")
            else:
                st.warning("Please predict risk first before sending alerts")

    if inputs:
        st.divider()
        st.subheader("Current Lab Values")
        st.json(inputs)

def show_health_records(patient_profile_id=None):
    """Display health records history"""
    if patient_profile_id is None:
        patient_profile = HealthService.get_patient_profile_by_user_id(st.session_state.user['id'])
        if patient_profile:
            patient_profile_id = patient_profile['id']

    if patient_profile_id:
        records = HealthService.get_patient_records(patient_profile_id, limit=20)

        if records:
            st.success(f"Found {len(records)} health records")

            for record in records:
                with st.expander(f"{record['created_at'][:10]} - Risk: {record['risk_level']}"):
                    col1, col2 = st.columns(2)

                    with col1:
                        st.write("**Lab Values:**")
                        if record['hemoglobin']:
                            st.write(f"Hemoglobin: {record['hemoglobin']} g/dL")
                        if record['blood_sugar']:
                            st.write(f"Blood Sugar: {record['blood_sugar']} mg/dL")
                        if record['systolic_bp']:
                            st.write(f"Blood Pressure: {record['systolic_bp']}/{record['diastolic_bp']} mmHg")

                    with col2:
                        st.write("**Additional Tests:**")
                        if record['tsh']:
                            st.write(f"TSH: {record['tsh']} mIU/L")
                        if record['amniotic_fluid']:
                            st.write(f"Amniotic Fluid: {record['amniotic_fluid']} cm")

                    if record['notes']:
                        st.write(f"**Notes:** {record['notes']}")
        else:
            st.info("No health records found")
    else:
        st.warning("Patient profile not found")

def show_notifications():
    """Display user notifications"""
    notifications = HealthService.get_user_notifications(st.session_state.user['id'])

    if notifications:
        st.success(f"You have {len(notifications)} notifications")

        for notif in notifications:
            status_icon = "✅" if notif['read_at'] else "🔔"
            with st.expander(f"{status_icon} {notif['sent_at'][:10]} - {notif['notification_type'].upper()}"):
                st.write(notif['message'])
                st.caption(f"Status: {notif['status']}")

                if not notif['read_at']:
                    if st.button(f"Mark as Read", key=f"read_{notif['id']}"):
                        HealthService.mark_notification_read(notif['id'])
                        st.rerun()
    else:
        st.info("No notifications")

def show_profile_editor():
    """Edit patient profile"""
    patient_profile = HealthService.get_patient_profile_by_user_id(st.session_state.user['id'])

    if patient_profile:
        with st.form("profile_form"):
            st.subheader("Update Your Profile")

            col1, col2 = st.columns(2)

            with col1:
                dob = st.date_input("Date of Birth", value=None)
                blood_group = st.selectbox("Blood Group", ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
                pregnancy_week = st.number_input("Current Pregnancy Week", min_value=0, max_value=42, value=patient_profile.get('pregnancy_week', 0))

            with col2:
                due_date = st.date_input("Expected Due Date", value=None)
                emergency_contact = st.text_input("Emergency Contact", value=patient_profile.get('emergency_contact', ''))
                address = st.text_area("Address", value=patient_profile.get('address', ''))

            if st.form_submit_button("Update Profile", type="primary"):
                update_data = {
                    'pregnancy_week': pregnancy_week,
                    'emergency_contact': emergency_contact,
                    'address': address,
                    'blood_group': blood_group if blood_group else None
                }

                if dob:
                    update_data['date_of_birth'] = dob.isoformat()
                if due_date:
                    update_data['expected_due_date'] = due_date.isoformat()

                success, message = AuthService.update_patient_profile(st.session_state.user['id'], update_data)

                if success:
                    st.success(message)
                else:
                    st.error(message)

if not st.session_state.authenticated:
    show_login_page()
else:
    show_main_app()
