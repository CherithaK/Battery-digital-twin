"""
Battery Health Prediction Inference Script

Loads the trained Random Forest model and makes predictions
based on input features provided via command line.

Usage:
    python ml/predict.py '{"features": [delta_ep, reversibility, noise, sei, ipa_decay, kinetics, diffusion, stability, consistency]}'

Input:
    JSON string with 9-element feature array

Output:
    JSON string with prediction results
"""

import sys
import os
import json
import numpy as np
import joblib

# Feature order expected by the model
FEATURE_ORDER = [
    'delta_ep',
    'reversibility_index',
    'noise_index',
    'sei_thickness',
    'ipa_decay_rate',
    'kinetics_proxy',
    'diffusion_proxy',
    'stability_index',
    'consistency_score'
]


def load_model():
    """Load the trained model from disk."""
    model_path = os.path.join(os.path.dirname(__file__), 'battery_health_model.pkl')
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found at {model_path}. "
            "Run train_model.py first."
        )
    
    return joblib.load(model_path)


def calculate_confidence(features: np.ndarray, prediction: float) -> float:
    """
    Calculate prediction confidence based on input feature validity.
    Returns value between 0.3 and 1.0.
    """
    confidence = 0.85  # Base confidence
    
    delta_ep = features[0]
    reversibility = features[1]
    noise = features[2]
    stability = features[7]
    
    # Penalize out-of-distribution inputs
    if delta_ep > 250:
        confidence -= 0.15
    if reversibility > 0.8:
        confidence -= 0.1
    if noise > 0.2:
        confidence -= 0.1
    if stability < 0.5:
        confidence -= 0.1
    
    # Penalize extreme predictions
    if prediction < 30 or prediction > 95:
        confidence -= 0.1
    
    return max(0.3, min(1.0, confidence))


def calculate_degradation_rate(features: np.ndarray, soh: float) -> float:
    """
    Estimate degradation rate based on features.
    Uses ipa_decay_rate and stability index.
    """
    ipa_decay = features[4]
    stability = features[7]
    
    # Base degradation from Ipa decay
    base_rate = abs(ipa_decay)
    
    # Adjust based on stability (unstable = faster degradation)
    stability_factor = 1 + (1 - stability)
    
    rate = base_rate * stability_factor
    return max(0.1, min(5.0, rate))


def calculate_rul(soh: float, degradation_rate: float) -> int | None:
    """
    Calculate Remaining Useful Life (cycles until SoH reaches 20%).
    """
    if degradation_rate <= 0 or soh <= 20:
        return None
    
    remaining = (soh - 20) / degradation_rate
    return max(1, round(remaining))


def predict(features: list) -> dict:
    """
    Make prediction using the trained model.
    
    Args:
        features: 9-element list of feature values
        
    Returns:
        Dictionary with prediction results
    """
    if len(features) != 9:
        raise ValueError(f"Expected 9 features, got {len(features)}")
    
    # Load model
    model = load_model()
    
    # Prepare input
    X = np.array(features).reshape(1, -1)
    
    # Make prediction
    soh = float(model.predict(X)[0])
    soh = max(20, min(100, soh))  # Clamp to valid range
    
    # Calculate additional metrics
    features_array = np.array(features)
    confidence = calculate_confidence(features_array, soh)
    degradation_rate = calculate_degradation_rate(features_array, soh)
    rul = calculate_rul(soh, degradation_rate)
    
    # Check for out-of-distribution
    is_ood = (
        features[0] > 250 or  # delta_ep
        features[1] > 1.0 or  # reversibility
        features[2] > 0.3     # noise
    )
    
    return {
        'stateOfHealth': round(soh, 2),
        'degradationRate': round(degradation_rate, 4),
        'remainingUsefulLife': rul,
        'confidence': round(confidence, 3),
        'isOutOfDistribution': is_ood,
        'modelType': 'RandomForest'
    }


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'No input provided',
            'usage': 'python predict.py \'{"features": [...]}\''
        }))
        sys.exit(1)
    
    try:
        input_data = json.loads(sys.argv[1])
        features = input_data.get('features', [])
        
        result = predict(features)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'errorType': type(e).__name__
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
