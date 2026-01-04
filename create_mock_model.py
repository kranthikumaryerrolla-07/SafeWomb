import pickle
import numpy as np

class MockMaternalRiskModel:
    def predict(self, X):
        """
        Mock model that returns risk predictions based on simple rules
        Returns: array of risk levels ["LOW", "MEDIUM", "HIGH"]
        """
        predictions = []
        for row in X:
            # Simple logic based on input values
            # X contains: [Hemoglobin, BloodSugar, SystolicBP, DiastolicBP, TSH, AmnioticFluid]
            if len(row) >= 6:
                hb, bs, sbp, dbp, tsh, af = row[:6]

                # Count risk factors
                risk_score = 0

                if hb < 10:
                    risk_score += 2
                elif hb < 11:
                    risk_score += 1

                if bs > 140:
                    risk_score += 2
                elif bs > 120:
                    risk_score += 1

                if sbp > 140:
                    risk_score += 2
                elif sbp > 130:
                    risk_score += 1

                if dbp > 90:
                    risk_score += 2
                elif dbp > 85:
                    risk_score += 1

                if tsh > 4 or tsh < 0.5:
                    risk_score += 1

                if af < 10:
                    risk_score += 2
                elif af < 12:
                    risk_score += 1

                # Determine risk level
                if risk_score >= 5:
                    predictions.append("HIGH")
                elif risk_score >= 2:
                    predictions.append("MEDIUM")
                else:
                    predictions.append("LOW")
            else:
                predictions.append("LOW")

        return np.array(predictions)

# Create and save the mock model
model = MockMaternalRiskModel()

with open("maternal_risk_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Mock model created successfully!")
