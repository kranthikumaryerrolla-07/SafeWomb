
def clinical_safety_override(lab_values, ml_risk):
    if lab_values.get("Hemoglobin", 99) < 8:
        return "HIGH"
    if lab_values.get("SystolicBP", 0) >= 150:
        return "HIGH"
    if lab_values.get("BloodSugar", 0) >= 180:
        return "HIGH"
    if lab_values.get("AmnioticFluid", 99) < 8:
        return "HIGH"
    return ml_risk

def run_maternal_risk_engine(patient_data, model):
    missing = [k for k in [
        "Hemoglobin","BloodSugar","SystolicBP","DiastolicBP","TSH","AmnioticFluid"
    ] if k not in patient_data]

    if missing:
        ml_risk = "INSUFFICIENT_DATA"
    else:
        ml_risk = model.predict([list(patient_data.values())])[0]

    final_risk = clinical_safety_override(patient_data, ml_risk)
    return {
        "final_risk": final_risk,
        "missing_tests": missing
    }
