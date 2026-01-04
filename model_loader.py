
import pickle

def load_model():
    with open("maternal_risk_model.pkl", "rb") as f:
        return pickle.load(f)
