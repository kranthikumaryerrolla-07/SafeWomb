# Quick Reference - UI to Backend Mapping

## Action Bindings

| UI Action | Button/Widget | Service Connector | Backend Target | Status |
|-----------|--------------|-------------------|----------------|--------|
| **UPLOAD** | "Extract from Upload" | `ocr_service.py` | → `engine.py` | ✅ Connected |
| **SPEAK** | "Parse Voice Input" | `voice_service.py` | → `engine.py` | ✅ Connected |
| **PREDICT** | "Predict Risk" | Direct call | `engine.py` | ✅ Complete |
| **ALERT** | "Send Alert" | `notification_service.py` | Output handler | ✅ Connected |

## Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📤 UPLOAD          🎤 SPEAK           ✍️ MANUAL               │
│  (Image/PDF)        (Text/Voice)       (Number inputs)          │
│       ↓                 ↓                    ↓                   │
│  ocr_service.py    voice_service.py     Direct input            │
│       ↓                 ↓                    ↓                   │
│       └─────────────────┴────────────────────┘                  │
│                          ↓                                       │
│                  session_state.inputs                            │
│                 (Lab values unified)                             │
│                          ↓                                       │
├─────────────────────────────────────────────────────────────────┤
│                     PROCESSING LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                          ↓                                       │
│               🔮 PREDICT RISK (Button)                           │
│                          ↓                                       │
│              engine.run_maternal_risk_engine()                   │
│                    (FROZEN BACKEND)                              │
│                          ↓                                       │
│         ┌────────────────┴────────────────┐                     │
│         ↓                                  ↓                     │
│   model.predict()              clinical_safety_override()        │
│   (ML Model)                   (Rule-based safety)               │
│         ↓                                  ↓                     │
│         └────────────────┬────────────────┘                     │
│                          ↓                                       │
│              {final_risk, missing_tests}                         │
│                          ↓                                       │
├─────────────────────────────────────────────────────────────────┤
│                      OUTPUT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                          ↓                                       │
│                  🚨 SEND ALERT (Button)                          │
│                          ↓                                       │
│            notification_service.dispatch_alert()                 │
│                          ↓                                       │
│         ┌────────────────┼────────────────┐                     │
│         ↓                ↓                ↓                      │
│      HIGH            MEDIUM            LOW                       │
│   (12 hours)       (48 hours)      (Routine)                    │
│         ↓                ↓                ↓                      │
│    Phone Call     Push + SMS      Push Only                     │
│    SMS + Email                                                   │
│    Push + Email                                                  │
│         ↓                ↓                ↓                      │
│    Mother           Mother             Mother                    │
│    Partner          Partner                                      │
│    PHC              PHC                                          │
│         ↓                ↓                ↓                      │
│   Auto-escalate   Escalate if      No escalation                │
│   after 60min     not booked                                     │
│                   in 36h                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Risk Level → Alert Mapping

| Risk Level | Time Window | Channels | Recipients | Escalation |
|------------|-------------|----------|------------|------------|
| **HIGH** | 12 hours | Phone, Push, SMS, Email | Mother, Partner, PHC | 60 min |
| **MEDIUM** | 48 hours | Push, SMS, Email | Mother, Partner | 36 hours |
| **LOW** | Routine | Push | Mother | None |
| **INSUFFICIENT_DATA** | N/A | Push, Email | Mother | None |

## Clinical Safety Rules (Hardcoded in engine.py)

```python
Hemoglobin < 8        → Force HIGH risk
SystolicBP ≥ 150      → Force HIGH risk
BloodSugar ≥ 180      → Force HIGH risk
AmnioticFluid < 8     → Force HIGH risk
```

These override ML predictions automatically.

## File Locations

```
app.py                      → Lines 22-33:  Upload action
                           → Lines 42-53:  Voice action
                           → Lines 77-100: Predict action
                           → Lines 104-124: Alert action

ocr_service.py             → parse_uploaded_file()
voice_service.py           → text_to_structured_data()
engine.py (FROZEN)         → run_maternal_risk_engine()
notification_service.py    → dispatch_alert()
```

## Testing Commands

```bash
# Run the app
streamlit run app.py

# Test flow
1. Upload lab report OR enter voice input OR type manually
2. Click "Predict Risk"
3. Click "Send Alert"
4. View notification details
```

## Integration Status

✅ **COMPLETE:**
- UI bindings
- Service interfaces
- Backend connection
- Data flow pipeline
- Session state management

⏳ **PENDING:**
- OCR API (Tesseract/Google Vision/Azure)
- Voice API (Speech-to-Text/Whisper)
- Notification APIs (Twilio/SendGrid/Firebase)

## Key Constraints

- ❌ NO backend logic changes
- ❌ NO model retraining
- ❌ NO schema modifications
- ✅ ONLY interface connections
- ✅ Service connectors ready for API integration
