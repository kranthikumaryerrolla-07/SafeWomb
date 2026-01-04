
import streamlit as st
from model_loader import load_model
from engine import run_maternal_risk_engine
from ocr_service import parse_uploaded_file
from voice_service import text_to_structured_data
from notification_service import dispatch_alert, send_notification

# Load model once
model = load_model()

st.title("Maternal Risk Prediction AI")

# Initialize session state for inputs
if 'inputs' not in st.session_state:
    st.session_state.inputs = {}

# UI Action 1: UPLOAD → OCR Service
st.header("📤 Upload Lab Report")
uploaded_file = st.file_uploader("Upload medical report (Image/PDF)", type=["png", "jpg", "jpeg", "pdf"])

if st.button("Extract from Upload"):
    if uploaded_file:
        # Map Upload → OCR Service
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

# UI Action 2: SPEAK → Voice Parser
st.header("🎤 Voice Input")
voice_text = st.text_area("Speak or type your symptoms and test results:",
                          placeholder="Example: My hemoglobin is 11.5 and blood sugar is 105. I feel tired and have headaches.")

if st.button("Parse Voice Input"):
    if voice_text:
        # Map Speak → Voice Parser
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

# Manual input (existing functionality)
st.header("✍️ Manual Entry")
inputs = st.session_state.inputs.copy()

for field in [
    "Hemoglobin","BloodSugar","SystolicBP","DiastolicBP","TSH","AmnioticFluid"
]:
    # Pre-fill with session state values if available
    default_val = inputs.get(field, 0.0)
    val = st.number_input(field, value=float(default_val), key=f"manual_{field}")
    if val > 0:
        inputs[field] = val

st.divider()

# UI Action 3: PREDICT → Risk Engine
st.header("🔮 Risk Assessment")
col1, col2 = st.columns(2)

with col1:
    if st.button("Predict Risk", type="primary"):
        if inputs:
            # Map Predict button → Risk Engine (engine.py)
            result = run_maternal_risk_engine(inputs, model)

            # Store result in session state
            st.session_state.prediction_result = result

            # Display risk level
            risk_level = result["final_risk"]

            if risk_level == "HIGH":
                st.error(f"🚨 Risk Level: {risk_level}")
            elif risk_level == "MEDIUM":
                st.warning(f"⚠️ Risk Level: {risk_level}")
            elif risk_level == "LOW":
                st.success(f"✅ Risk Level: {risk_level}")
            else:
                st.info(f"ℹ️ Status: {risk_level}")

            if result["missing_tests"]:
                st.warning("Missing Tests: " + ", ".join(result["missing_tests"]))
        else:
            st.warning("Please provide at least one lab value")

# UI Action 4: ALERT → Notification Dispatcher
with col2:
    if st.button("Send Alert", type="secondary"):
        if 'prediction_result' in st.session_state:
            result = st.session_state.prediction_result

            # Map Alert → Notification Dispatcher
            notification = dispatch_alert(
                risk_level=result["final_risk"],
                patient_data=inputs,
                missing_tests=result.get("missing_tests")
            )

            # Send notification
            delivery_status = send_notification(notification)

            st.success("Alert dispatched!")

            with st.expander("📱 Notification Details"):
                st.json(notification)
                st.caption(f"Status: {delivery_status['status']}")
        else:
            st.warning("Please predict risk first before sending alerts")

# Display current input summary
if inputs:
    st.divider()
    st.subheader("Current Lab Values")
    st.json(inputs)
