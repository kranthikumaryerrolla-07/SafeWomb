# UI to Backend Mapping Summary

## Architecture Overview

```
[UI Layer: app.py] → [Service Layer] → [Backend Engine: engine.py + model_loader.py]
                          ↓
                   [Output: Notifications]
```

## Action Mappings

### 1. UPLOAD → OCR Service

**UI Component:** `app.py:20-33`
- File uploader widget accepts PNG, JPG, JPEG, PDF
- "Extract from Upload" button triggers OCR pipeline

**Service Connector:** `ocr_service.py`
- `parse_uploaded_file(uploaded_file)` - Processes uploaded file
- `extract_lab_values_from_image(uploaded_file)` - Extracts lab values using OCR

**Data Flow:**
```
User uploads file → parse_uploaded_file() → Extracted lab_values dict → Updates session_state.inputs
```

**Output Format:**
```python
{
  "Hemoglobin": 12.5,
  "BloodSugar": 95.0,
  "SystolicBP": 120.0,
  "DiastolicBP": 80.0,
  "TSH": 2.5,
  "AmnioticFluid": 12.0
}
```

**Backend Integration Status:** Interface ready, OCR engine integration pending

---

### 2. SPEAK → Voice Parser

**UI Component:** `app.py:38-53`
- Text area for voice/text input
- "Parse Voice Input" button triggers voice parsing

**Service Connector:** `voice_service.py`
- `text_to_structured_data(voice_text)` - Converts text to structured lab values
- `parse_voice_input(audio_data)` - Processes audio (future)

**Data Flow:**
```
User speaks/types → text_to_structured_data() → Structured lab_values dict → Updates session_state.inputs
```

**Output Format:**
```python
{
  "lab_values": {
    "Hemoglobin": 11.0,
    "BloodSugar": 110.0
  },
  "symptoms": {
    "fatigue": True,
    "headache": True
  }
}
```

**Backend Integration Status:** Interface ready, NLP/Speech-to-Text integration pending

---

### 3. PREDICT → Risk Engine (FROZEN)

**UI Component:** `app.py:77-100`
- "Predict Risk" button triggers risk assessment
- Displays color-coded risk level (RED/ORANGE/GREEN)

**Backend Engine:** `engine.py` (UNMODIFIED)
- `run_maternal_risk_engine(inputs, model)` - Core risk assessment
- `clinical_safety_override(lab_values, ml_risk)` - Clinical rules

**Data Flow:**
```
inputs dict → run_maternal_risk_engine() → {final_risk, missing_tests} → Store in session_state
```

**Model:** `model_loader.py` (FROZEN)
- Loads pre-trained pickle model
- Model schema matches `schema.json` lab_values

**Output Format:**
```python
{
  "final_risk": "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA",
  "missing_tests": ["TSH", "AmnioticFluid"]
}
```

**Backend Integration Status:** COMPLETE - Backend logic unchanged

---

### 4. ALERT → Notification Dispatcher

**UI Component:** `app.py:104-124`
- "Send Alert" button triggers notification dispatch
- Displays notification details in expandable section

**Service Connector:** `notification_service.py`
- `dispatch_alert(risk_level, patient_data, missing_tests)` - Routes to correct alert type
- `send_notification(notification_data)` - Executes notification delivery

**Alert Types by Risk Level:**

#### HIGH Risk Alert
```python
{
  "urgency": "CRITICAL",
  "appointment_deadline": "12 hours",
  "channels": ["phone_call", "push_notification", "sms", "email"],
  "recipients": ["mother", "partner", "phc"],
  "escalation": {
    "enabled": True,
    "escalate_after_minutes": 60
  }
}
```

#### MEDIUM Risk Alert
```python
{
  "urgency": "HIGH",
  "appointment_deadline": "48 hours",
  "channels": ["push_notification", "sms", "email"],
  "recipients": ["mother", "partner"],
  "escalation": {
    "enabled": True,
    "escalate_after_hours": 36
  }
}
```

#### LOW Risk Alert
```python
{
  "urgency": "ROUTINE",
  "channels": ["push_notification"],
  "recipients": ["mother"],
  "message": "Positive reinforcement"
}
```

**Data Flow:**
```
prediction_result → dispatch_alert() → notification dict → send_notification() → delivery_status
```

**Backend Integration Status:** Interface ready, SMS/Email/Push integration pending

---

## Service Integration Checklist

### Completed
- ✅ UI bindings for all 4 actions
- ✅ Service connector interfaces created
- ✅ Backend engine connection (Predict → engine.py)
- ✅ Notification routing logic (risk level → alert type)
- ✅ Session state management for data flow
- ✅ Calendar behavior specification (48h/12h windows)

### Pending External Integrations
- ⏳ OCR Service: Tesseract OCR, Google Vision API, or Azure OCR
- ⏳ Voice Service: Google Speech-to-Text, Whisper API, or Azure Speech
- ⏳ Notification Service: Twilio (SMS), SendGrid (Email), Firebase (Push), Vonage (Calls)

---

## File Structure

```
project/
├── app.py                      # UI Layer - All 4 action buttons
├── engine.py                   # Backend Engine (FROZEN)
├── model_loader.py             # Model Loading (FROZEN)
├── schema.json                 # Data Schema (FIXED)
├── ocr_service.py              # Upload → OCR connector
├── voice_service.py            # Speak → Voice parser connector
├── notification_service.py     # Alert → Notification dispatcher
└── requirements.txt            # Dependencies
```

---

## Data Constraints (FIXED SCHEMA)

### Required Lab Values (schema.json)
```json
{
  "lab_values": [
    "Hemoglobin",
    "BloodSugar",
    "SystolicBP",
    "DiastolicBP",
    "TSH",
    "AmnioticFluid"
  ]
}
```

All service connectors must output data matching this exact schema.

---

## Critical Safety Rules (From engine.py)

**Clinical Override Thresholds (HARDCODED):**
- Hemoglobin < 8 → HIGH risk
- SystolicBP ≥ 150 → HIGH risk
- BloodSugar ≥ 180 → HIGH risk
- AmnioticFluid < 8 → HIGH risk

These rules override ML predictions and are enforced by `clinical_safety_override()`.

---

## Testing Guide

### Test Upload Action
1. Click "📤 Upload Lab Report"
2. Upload image/PDF
3. Click "Extract from Upload"
4. Verify extracted values appear in session state

### Test Voice Action
1. Enter text in "🎤 Voice Input"
2. Click "Parse Voice Input"
3. Verify parsed values update inputs

### Test Predict Action
1. Enter lab values manually OR via upload/voice
2. Click "Predict Risk"
3. Verify risk level displays correctly
4. Verify missing tests warning appears if data incomplete

### Test Alert Action
1. Complete prediction first
2. Click "Send Alert"
3. Verify notification details show:
   - Correct urgency level
   - Appropriate channels
   - Correct recipients
   - Proper time windows (12h/48h)

---

## API Integration Points (Future)

### OCR Service Integration
```python
# In ocr_service.py, replace mock with:
import pytesseract
from PIL import Image

def extract_lab_values_from_image(uploaded_file):
    image = Image.open(uploaded_file)
    text = pytesseract.image_to_string(image)
    # Add NLP extraction logic
    return extracted_values
```

### Voice Service Integration
```python
# In voice_service.py, replace mock with:
import speech_recognition as sr

def parse_voice_input(audio_data):
    recognizer = sr.Recognizer()
    text = recognizer.recognize_google(audio_data)
    return text_to_structured_data(text)
```

### Notification Service Integration
```python
# In notification_service.py, replace mock with:
from twilio.rest import Client

def send_notification(notification_data):
    client = Client(account_sid, auth_token)
    # Send SMS, emails, push notifications
    return delivery_status
```

---

## Summary

**All UI actions successfully bound to backend services:**

1. **UPLOAD** → `ocr_service.parse_uploaded_file()` → Updates inputs
2. **SPEAK** → `voice_service.text_to_structured_data()` → Updates inputs
3. **PREDICT** → `engine.run_maternal_risk_engine()` → Returns risk assessment
4. **ALERT** → `notification_service.dispatch_alert()` → Sends notifications

**Backend Logic:** Completely unchanged and protected
**Schema:** Fixed and enforced across all connectors
**Model:** Frozen, no retraining required

System is ready for external API integration (OCR, Voice, Notifications).
