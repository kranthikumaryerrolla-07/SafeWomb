import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def load_model():
    try:
        with open("maternal_risk_model.pkl", "rb") as f:
            return pickle.load(f)
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

model = load_model()

MEDICAL_RANGES = {
    'age': (15, 50, 'Age should be between 15-50 years'),
    'bmi': (15, 50, 'BMI should be between 15-50'),
    'gestational_week': (1, 42, 'Gestational week should be between 1-42'),
    'systolic_bp': (70, 200, 'Systolic BP should be between 70-200 mmHg'),
    'diastolic_bp': (40, 130, 'Diastolic BP should be between 40-130 mmHg'),
    'blood_sugar': (50, 400, 'Blood Sugar should be between 50-400 mg/dL'),
    'hemoglobin': (5, 20, 'Hemoglobin should be between 5-20 g/dL'),
    'kick_count': (0, 50, 'Kick count should be between 0-50 per hour'),
    'amniotic_fluid': (0, 30, 'Amniotic fluid should be between 0-30 cm')
}

def validate_input(data):
    errors = []
    for key, (min_val, max_val, message) in MEDICAL_RANGES.items():
        if key in data:
            value = float(data[key])
            if value < min_val or value > max_val:
                errors.append(message)
    return errors

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        validation_errors = validate_input(data)
        if validation_errors:
            return jsonify({'error': ', '.join(validation_errors)}), 400

        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        features = [
            float(data.get('age', 25)),
            float(data.get('bmi', 22)),
            float(data.get('gestational_week', 20)),
            float(data.get('systolic_bp', 120)),
            float(data.get('diastolic_bp', 80)),
            float(data.get('blood_sugar', 100)),
            float(data.get('hemoglobin', 12)),
            float(data.get('kick_count', 10)),
            float(data.get('amniotic_fluid', 15)),
            int(data.get('previous_complications', 0)),
            int(data.get('rh_factor', 1)),
            int(data.get('pregnancy_order', 1))
        ]

        prediction = model.predict([features])[0]

        risk_levels = {0: 'LOW', 1: 'MEDIUM', 2: 'HIGH'}
        risk_level = risk_levels.get(prediction, 'MEDIUM')

        return jsonify({
            'risk_level': risk_level,
            'prediction_value': int(prediction)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
