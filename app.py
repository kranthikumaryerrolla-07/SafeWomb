
import streamlit as st
from model_loader import load_model
from engine import run_maternal_risk_engine

model = load_model()

st.title("Maternal Risk Prediction AI")

inputs = {}
for field in [
    "Hemoglobin","BloodSugar","SystolicBP","DiastolicBP","TSH","AmnioticFluid"
]:
    val = st.number_input(field, value=0.0)
    if val > 0:
        inputs[field] = val

if st.button("Predict Risk"):
    result = run_maternal_risk_engine(inputs, model)
    st.subheader("Final Risk Level")
    st.write(result["final_risk"])
    if result["missing_tests"]:
        st.warning("Missing Tests: " + ", ".join(result["missing_tests"]))
