"""
OCR Service - Extracts lab values from uploaded medical reports
Does not modify backend logic - only interfaces with engine.py
"""

def extract_lab_values_from_image(uploaded_file):
    """
    Mock OCR function that extracts lab values from medical reports
    In production: integrate with Tesseract OCR, Google Vision API, or Azure OCR

    Returns: dict of lab values matching schema.json lab_values
    """
    # Placeholder: In production, implement actual OCR logic here
    # For now, returns empty dict - OCR service to be integrated

    extracted_data = {
        # "Hemoglobin": 12.5,
        # "BloodSugar": 95.0,
        # "SystolicBP": 120.0,
        # "DiastolicBP": 80.0,
        # "TSH": 2.5,
        # "AmnioticFluid": 12.0
    }

    return extracted_data


def parse_uploaded_file(uploaded_file):
    """
    Process uploaded file and extract structured data

    Args:
        uploaded_file: Streamlit UploadedFile object

    Returns:
        dict: Extracted lab values ready for engine.py
    """
    if uploaded_file is None:
        return {}

    # Get file details
    file_name = uploaded_file.name
    file_type = uploaded_file.type

    # Extract lab values using OCR
    lab_values = extract_lab_values_from_image(uploaded_file)

    return lab_values
