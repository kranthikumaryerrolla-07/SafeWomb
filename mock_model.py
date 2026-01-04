import numpy as np

class MockMaternalRiskModel:
    """
    Mock ML model for maternal risk prediction
    Simulates a trained scikit-learn model
    """
    def predict(self, X):
        """
        Predict risk level based on lab values

        Args:
            X: List of lists containing [Hemoglobin, BloodSugar, SystolicBP, DiastolicBP, TSH, AmnioticFluid]

        Returns:
            Array of risk levels: "LOW", "MEDIUM", or "HIGH"
        """
        predictions = []

        for row in X:
            if len(row) < 6:
                predictions.append("LOW")
                continue

            hb, bs, sbp, dbp, tsh, af = row[:6]

            risk_score = 0

            # Hemoglobin scoring
            if hb < 10:
                risk_score += 2
            elif hb < 11:
                risk_score += 1

            # Blood sugar scoring
            if bs > 140:
                risk_score += 2
            elif bs > 120:
                risk_score += 1

            # Systolic BP scoring
            if sbp > 140:
                risk_score += 2
            elif sbp > 130:
                risk_score += 1

            # Diastolic BP scoring
            if dbp > 90:
                risk_score += 2
            elif dbp > 85:
                risk_score += 1

            # TSH scoring
            if tsh > 4 or tsh < 0.5:
                risk_score += 1

            # Amniotic fluid scoring
            if af < 10:
                risk_score += 2
            elif af < 12:
                risk_score += 1

            # Determine final risk level
            if risk_score >= 5:
                predictions.append("HIGH")
            elif risk_score >= 2:
                predictions.append("MEDIUM")
            else:
                predictions.append("LOW")

        return np.array(predictions)
