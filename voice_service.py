"""
Voice Service - Parses voice input to extract symptoms and lab values
Does not modify backend logic - only interfaces with engine.py
"""

def parse_voice_input(audio_data):
    """
    Mock voice parser function that converts speech to structured data
    In production: integrate with Google Speech-to-Text, Azure Speech, or Whisper API

    Returns: dict containing lab values and symptoms from voice input
    """
    # Placeholder: In production, implement actual speech-to-text + NLP here
    # For now, returns empty dict - voice service to be integrated

    parsed_data = {
        "lab_values": {
            # "Hemoglobin": 11.0,
            # "BloodSugar": 110.0,
        },
        "symptoms": {
            # "fatigue": True,
            # "headache": True,
        }
    }

    return parsed_data


def text_to_structured_data(text_input):
    """
    Parse text input (from voice transcription or manual entry)
    Extract lab values and symptoms using NLP

    Args:
        text_input: str - User's voice input as text

    Returns:
        dict: Structured data ready for engine.py
    """
    if not text_input:
        return {}

    # Simple keyword extraction
    # In production: use NLP models to extract entities

    extracted_values = {}
    text_lower = text_input.lower()

    # Example patterns to match
    if "hemoglobin" in text_lower or "hb" in text_lower:
        # Extract numeric value near the keyword
        pass

    if "blood sugar" in text_lower or "glucose" in text_lower:
        pass

    if "blood pressure" in text_lower or "bp" in text_lower:
        pass

    return extracted_values
