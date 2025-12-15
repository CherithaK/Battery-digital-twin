"""
Battery Health Synthetic Training Data Generator

Generates 150 synthetic battery cycles with realistic degradation patterns based on
physics-based electrochemical models. The generated data simulates battery aging
across multiple cycles with the following features:

Physics-Based Features:
- delta_ep: Peak separation (mV) - starts at ~59mV (ideal), increases with degradation (59-300mV)
- reversibility_index: |log(Ipa/Ipc)| - starts at ~0.1, increases with degradation (0.1-1.0)
- noise_index: RMS noise / peak current - starts at ~0.05, increases with degradation (0.05-0.3)
- sei_thickness: Solid-electrolyte interphase thickness (nm) - grows with sqrt(cycles) (1-100nm)
- ipa_decay_rate: Anodic peak current decay rate (%/cycle)
- kinetics_proxy: Charge-transfer kinetics indicator (normalized 0-1)
- diffusion_proxy: Diffusion coefficient proxy (normalized 0-1)
- stability_index: Overall cycling stability (0.9 → 0.5 as battery ages)
- consistency_score: Data consistency metric (1.0 → 0.6 with degradation)

Target:
- soh: State of Health (%) - follows realistic non-linear degradation curve (100% → 20%)

Usage:
    python ml/training_data_generator.py

Output:
    ml/training_data.csv
"""

import numpy as np
import pandas as pd
import os

# Set random seed for reproducibility
np.random.seed(42)

def generate_soh_trajectory(n_samples: int, final_soh_range: tuple = (20, 60)) -> np.ndarray:
    """
    Generate non-linear SoH degradation trajectory.
    Uses a combination of linear and accelerated degradation phases.
    """
    final_soh = np.random.uniform(final_soh_range[0], final_soh_range[1])
    
    # Create cycle indices
    cycles = np.linspace(0, 1, n_samples)
    
    # Non-linear degradation: slow at first, accelerates later
    # Uses Weibull-like degradation curve
    beta = np.random.uniform(1.2, 2.0)  # Shape parameter
    degradation = 1 - cycles ** beta
    
    # Map to SoH range
    soh = final_soh + (100 - final_soh) * degradation
    
    # Add small noise
    noise = np.random.normal(0, 0.5, n_samples)
    soh = np.clip(soh + noise, 20, 100)
    
    return soh


def generate_training_data(n_samples: int = 150) -> pd.DataFrame:
    """
    Generate synthetic battery cycle data with physics-based features.
    """
    data = []
    
    # Generate SoH trajectory
    soh_values = generate_soh_trajectory(n_samples)
    
    for i, soh in enumerate(soh_values):
        cycle = i + 1
        degradation_factor = (100 - soh) / 80  # 0 to 1 as battery degrades
        
        # Peak separation: 59mV (ideal) to 300mV (degraded)
        # Increases with degradation, with some noise
        base_delta_ep = 59 + 241 * (degradation_factor ** 0.8)
        delta_ep = base_delta_ep + np.random.normal(0, 5)
        delta_ep = np.clip(delta_ep, 59, 300)
        
        # Reversibility index: 0.1 (ideal) to 1.0 (degraded)
        base_reversibility = 0.1 + 0.9 * (degradation_factor ** 0.9)
        reversibility_index = base_reversibility + np.random.normal(0, 0.03)
        reversibility_index = np.clip(reversibility_index, 0.1, 1.0)
        
        # Noise index: 0.05 (clean) to 0.3 (noisy)
        base_noise = 0.05 + 0.25 * degradation_factor
        noise_index = base_noise + np.random.normal(0, 0.01)
        noise_index = np.clip(noise_index, 0.05, 0.3)
        
        # SEI thickness: grows with sqrt(cycle), 1-100nm
        base_sei = 1 + 99 * np.sqrt(cycle / n_samples)
        sei_thickness = base_sei * (1 + 0.1 * degradation_factor)
        sei_thickness = np.clip(sei_thickness + np.random.normal(0, 2), 1, 100)
        
        # Ipa decay rate: 0.5-2% per cycle, increases with age
        base_decay = 0.5 + 1.5 * degradation_factor
        ipa_decay_rate = base_decay + np.random.normal(0, 0.1)
        ipa_decay_rate = np.clip(ipa_decay_rate, 0.1, 3.0)
        
        # Kinetics proxy: 1 (fast) to 0.3 (slow) with degradation
        kinetics_proxy = 1.0 - 0.7 * degradation_factor + np.random.normal(0, 0.03)
        kinetics_proxy = np.clip(kinetics_proxy, 0.2, 1.0)
        
        # Diffusion proxy: 1 (good) to 0.3 (poor) with degradation
        diffusion_proxy = 1.0 - 0.7 * (degradation_factor ** 1.1) + np.random.normal(0, 0.02)
        diffusion_proxy = np.clip(diffusion_proxy, 0.2, 1.0)
        
        # Stability index: 0.9 (stable) to 0.5 (unstable)
        stability_index = 0.9 - 0.4 * degradation_factor + np.random.normal(0, 0.02)
        stability_index = np.clip(stability_index, 0.4, 0.95)
        
        # Consistency score: 1.0 (consistent) to 0.6 (inconsistent)
        consistency_score = 1.0 - 0.4 * (degradation_factor ** 0.8) + np.random.normal(0, 0.02)
        consistency_score = np.clip(consistency_score, 0.5, 1.0)
        
        data.append({
            'delta_ep': round(delta_ep, 2),
            'reversibility_index': round(reversibility_index, 4),
            'noise_index': round(noise_index, 4),
            'sei_thickness': round(sei_thickness, 2),
            'ipa_decay_rate': round(ipa_decay_rate, 4),
            'kinetics_proxy': round(kinetics_proxy, 4),
            'diffusion_proxy': round(diffusion_proxy, 4),
            'stability_index': round(stability_index, 4),
            'consistency_score': round(consistency_score, 4),
            'cycle_count': cycle,
            'soh': round(soh, 2)
        })
    
    return pd.DataFrame(data)


def main():
    print("Generating synthetic battery training data...")
    print("=" * 60)
    
    # Generate data
    df = generate_training_data(n_samples=150)
    
    # Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), 'training_data.csv')
    df.to_csv(output_path, index=False)
    
    print(f"Generated {len(df)} samples")
    print(f"Output saved to: {output_path}")
    print()
    print("Data Summary:")
    print("-" * 60)
    print(df.describe().round(3))
    print()
    print("Sample data (first 5 rows):")
    print(df.head())
    print()
    print("Sample data (last 5 rows):")
    print(df.tail())
    print()
    print("SoH range: {:.1f}% - {:.1f}%".format(df['soh'].min(), df['soh'].max()))


if __name__ == "__main__":
    main()
