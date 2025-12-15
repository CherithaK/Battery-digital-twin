import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

export interface MLPrediction {
  stateOfHealth: number;
  degradationRate: number;
  remainingUsefulLife: number | null;
  confidence: number;
  isOutOfDistribution: boolean;
  modelType: string;
}

export interface FeatureVector {
  deltaEp: number;
  reversibilityIndex: number;
  noiseIndex: number;
  seiThickness: number;
  ipaDecayRate: number;
  kineticsProxy: number;
  diffusionProxy: number;
  stabilityIndex: number;
  consistencyScore: number;
}

const MODEL_PATH = path.join(process.cwd(), "ml", "battery_health_model.pkl");
const PREDICT_SCRIPT = path.join(process.cwd(), "ml", "predict.py");

let modelAvailable: boolean | null = null;

export function checkModelAvailable(): boolean {
  if (modelAvailable !== null) {
    return modelAvailable;
  }
  
  modelAvailable = fs.existsSync(MODEL_PATH) && fs.existsSync(PREDICT_SCRIPT);
  
  if (!modelAvailable) {
    console.warn("[ML] Random Forest model not found. Using weighted fusion fallback.");
  } else {
    console.log("[ML] Random Forest model loaded successfully.");
  }
  
  return modelAvailable;
}

export function featuresToArray(features: FeatureVector): number[] {
  return [
    features.deltaEp,
    features.reversibilityIndex,
    features.noiseIndex,
    features.seiThickness,
    features.ipaDecayRate,
    features.kineticsProxy,
    features.diffusionProxy,
    features.stabilityIndex,
    features.consistencyScore,
  ];
}

export async function predictBatteryHealth(
  features: FeatureVector
): Promise<MLPrediction | null> {
  if (!checkModelAvailable()) {
    return null;
  }

  const featureArray = featuresToArray(features);
  const input = JSON.stringify({ features: featureArray });

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn("[ML] Prediction timed out (>5000ms)");
      resolve(null);
    }, 5000);

    try {
      const python = spawn("python", [PREDICT_SCRIPT, input], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      python.on("close", (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.warn(`[ML] Python process exited with code ${code}`);
          if (stderr) {
            console.warn(`[ML] stderr: ${stderr}`);
          }
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          
          if (result.error) {
            console.warn(`[ML] Prediction error: ${result.error}`);
            resolve(null);
            return;
          }

          resolve({
            stateOfHealth: result.stateOfHealth,
            degradationRate: result.degradationRate,
            remainingUsefulLife: result.remainingUsefulLife,
            confidence: result.confidence,
            isOutOfDistribution: result.isOutOfDistribution,
            modelType: result.modelType || "RandomForest",
          });
        } catch (parseError) {
          console.warn("[ML] Failed to parse prediction output:", stdout);
          resolve(null);
        }
      });

      python.on("error", (err) => {
        clearTimeout(timeout);
        console.warn("[ML] Failed to spawn Python process:", err.message);
        resolve(null);
      });
    } catch (err) {
      clearTimeout(timeout);
      console.warn("[ML] Unexpected error:", err);
      resolve(null);
    }
  });
}

export function logModelStatus(): void {
  const available = checkModelAvailable();
  console.log(`[ML] Model status: ${available ? "Available" : "Not available"}`);
  console.log(`[ML] Model path: ${MODEL_PATH}`);
  console.log(`[ML] Predict script: ${PREDICT_SCRIPT}`);
}
