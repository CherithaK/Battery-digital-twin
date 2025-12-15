"""
Random Forest Model Training for Battery Health Prediction

Trains a Random Forest Regressor on physics-derived electrochemical features
to predict State of Health (SoH).

Model Configuration:
- Algorithm: Random Forest Regressor
- Trees: 100 estimators
- Max Depth: 8 (prevents overfitting on small dataset)
- Min Samples Split: 5
- Min Samples Leaf: 2

Usage:
    python ml/train_model.py

Outputs:
    - ml/battery_health_model.pkl: Trained model
    - ml/feature_importance.json: Feature importance rankings
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib


def load_training_data():
    """Load training data from CSV."""
    data_path = os.path.join(os.path.dirname(__file__), 'training_data.csv')
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Training data not found at {data_path}. "
            "Run training_data_generator.py first."
        )
    
    return pd.read_csv(data_path)


def train_model():
    """Train Random Forest model and evaluate performance."""
    print("=" * 60)
    print("Battery Health Random Forest Model Training")
    print("=" * 60)
    
    # Load data
    print("\n[1/5] Loading training data...")
    df = load_training_data()
    print(f"Loaded {len(df)} samples")
    
    # Define features and target
    feature_columns = [
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
    
    X = df[feature_columns].values
    y = df['soh'].values
    
    print(f"Features: {len(feature_columns)}")
    print(f"Feature names: {', '.join(feature_columns)}")
    
    # Split data
    print("\n[2/5] Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.2, 
        random_state=42
    )
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    # Train model
    print("\n[3/5] Training Random Forest Regressor...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    print("Training complete!")
    
    # Evaluate
    print("\n[4/5] Evaluating model performance...")
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    test_mae = mean_absolute_error(y_test, y_pred_test)
    
    print("\n" + "-" * 40)
    print("Model Training Report")
    print("-" * 40)
    print(f"Train R² Score: {train_r2:.4f}")
    print(f"Test R² Score:  {test_r2:.4f}")
    print(f"Test RMSE:      {test_rmse:.2f}%")
    print(f"Test MAE:       {test_mae:.2f}%")
    print("-" * 40)
    
    # Feature importance
    print("\nFeature Importance:")
    importance = model.feature_importances_
    importance_dict = {}
    
    sorted_idx = np.argsort(importance)[::-1]
    for idx in sorted_idx:
        pct = importance[idx] * 100
        print(f"  {feature_columns[idx]:25s}: {pct:5.1f}%")
        importance_dict[feature_columns[idx]] = round(importance[idx], 4)
    
    # Save model
    print("\n[5/5] Saving model and artifacts...")
    model_path = os.path.join(os.path.dirname(__file__), 'battery_health_model.pkl')
    joblib.dump(model, model_path)
    model_size = os.path.getsize(model_path) / (1024 * 1024)
    print(f"Model saved to: {model_path}")
    print(f"Model size: {model_size:.2f} MB")
    
    # Save feature importance
    importance_path = os.path.join(os.path.dirname(__file__), 'feature_importance.json')
    with open(importance_path, 'w') as f:
        json.dump({
            'feature_importance': importance_dict,
            'feature_order': feature_columns,
            'model_metrics': {
                'train_r2': round(train_r2, 4),
                'test_r2': round(test_r2, 4),
                'test_rmse': round(test_rmse, 4),
                'test_mae': round(test_mae, 4)
            }
        }, f, indent=2)
    print(f"Feature importance saved to: {importance_path}")
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    
    # Validation check
    if test_r2 >= 0.90:
        print(f"\nSUCCESS: Model achieved R² = {test_r2:.4f} (target >= 0.90)")
    else:
        print(f"\nWARNING: Model R² = {test_r2:.4f} is below target (0.90)")
    
    return model, test_r2


if __name__ == "__main__":
    train_model()
