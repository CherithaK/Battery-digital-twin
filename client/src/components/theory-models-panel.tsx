import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, FlaskConical, TrendingUp, Brain } from "lucide-react";

function EquationBlock({ 
  name, 
  equation, 
  meaning, 
  usage 
}: { 
  name: string; 
  equation: string; 
  meaning: string; 
  usage: string;
}) {
  return (
    <div className="space-y-2 py-3">
      <h4 className="text-sm font-medium">{name}</h4>
      <div className="bg-muted/50 rounded-md px-3 py-2 font-mono text-sm">
        {equation}
      </div>
      <p className="text-xs text-muted-foreground"><span className="font-medium">Meaning:</span> {meaning}</p>
      <p className="text-xs text-muted-foreground"><span className="font-medium">Usage:</span> {usage}</p>
    </div>
  );
}

function FeatureBlock({ 
  name, 
  description 
}: { 
  name: string; 
  description: string;
}) {
  return (
    <div className="py-2">
      <span className="text-sm font-medium">{name}</span>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

export function TheoryModelsPanel({ testId }: { testId?: string }) {
  return (
    <ScrollArea className="h-full" data-testid={testId}>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Theory & Models
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scientific reference for electrochemical analysis methodology
          </p>
        </div>

        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <FlaskConical className="w-4 h-4 text-primary" />
              Section A: Electrochemical Models Used
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <EquationBlock
              name="Randles–Ševčík Equation"
              equation="Ip = (2.69 × 10⁵) n³ᐟ² A D¹ᐟ² C v¹ᐟ²"
              meaning="Relates peak current to diffusion coefficient and scan rate for reversible systems."
              usage="Diffusion degradation proxy — used for relative trend analysis across cycles."
            />
            <Separator />
            <EquationBlock
              name="Peak Separation (ΔEp)"
              equation="ΔEp = |Epa - Epc|"
              meaning="Voltage difference between anodic and cathodic peaks indicates electrode kinetics."
              usage="Bounded to 300 mV maximum; larger values suggest sluggish kinetics or degradation."
            />
            <Separator />
            <EquationBlock
              name="Reversibility Index"
              equation="R = |log₁₀(Ipa / Ipc)|"
              meaning="Logarithmic ratio of peak currents measures electrochemical reversibility."
              usage="Values near 0 indicate ideal reversibility; increasing values suggest capacity fade."
            />
            <Separator />
            <EquationBlock
              name="Butler–Volmer Kinetics"
              equation="i = i₀ [exp(αₐfη) - exp(-αcfη)]"
              meaning="Describes charge-transfer kinetics at electrode-electrolyte interface."
              usage="Charge-transfer proxy derived from peak current ratios and overpotential."
            />
            <Separator />
            <EquationBlock
              name="Capacitive vs Faradaic Current"
              equation="i = k₁v + k₂v¹ᐟ²"
              meaning="Separates surface capacitive effects from diffusion-controlled Faradaic processes."
              usage="Capacitive fraction indicates surface degradation or SEI growth effects."
            />
            <Separator />
            <EquationBlock
              name="Noise Power Index"
              equation="NPI = σ(di/dV) / mean(|i|)"
              meaning="Normalized derivative noise quantifies signal quality and electrode stability."
              usage="Stability indicator — higher values suggest electrode surface irregularities."
            />
            <Separator />
            <EquationBlock
              name="SEI Growth Model"
              equation="δ(n) = δ₀ + k√n (saturating at 100 nm)"
              meaning="Solid-electrolyte interphase thickness grows with square root of cycle count."
              usage="Bounded 1–100 nm; tracks passivation layer evolution affecting capacity."
            />
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              Section B: Multi-Cycle Temporal Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Computed only when multiple compatible cycles are available.
            </p>
            <div className="space-y-1">
              <FeatureBlock
                name="ΔEp Slope"
                description="Rate of change in peak separation across cycles; positive values indicate kinetic degradation."
              />
              <Separator />
              <FeatureBlock
                name="Peak Current Decay (Ipa/Ipc)"
                description="Percentage decrease in peak currents per cycle; primary capacity fade indicator."
              />
              <Separator />
              <FeatureBlock
                name="Peak Potential Shift"
                description="Migration of peak potentials indicating changes in thermodynamic equilibrium."
              />
              <Separator />
              <FeatureBlock
                name="Reversibility Drift"
                description="Change in reversibility index over cycles; tracks symmetry evolution."
              />
              <Separator />
              <FeatureBlock
                name="Noise Growth"
                description="Increase in noise power index suggesting progressive surface degradation."
              />
              <Separator />
              <FeatureBlock
                name="Stability Index"
                description="Composite metric (0–1) combining temporal feature consistency across cycles."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Brain className="w-4 h-4 text-primary" />
              Section C: Machine Learning Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-md p-4 border border-border">
              <p className="text-sm italic text-muted-foreground">
                "Physics governs behavior. Machine learning learns trends from physics-derived features."
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Model Architecture</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Gradient Boosting Regressor trained on physics-derived electrochemical features.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium">Input Features</h4>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                  <li>Physics-derived metrics (ΔEp, reversibility, peak currents, SEI thickness)</li>
                  <li>Temporal features (decay rates, drift coefficients, stability indices)</li>
                  <li>Cycle index for degradation trajectory modeling</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  Note: Raw voltage/current data are never used as direct ML inputs.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium">Model Outputs</h4>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                  <li>State of Health (SoH) — estimated battery health percentage</li>
                  <li>Degradation Rate — capacity fade per cycle</li>
                  <li>Remaining Useful Life Proxy — estimated cycles until threshold</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center pt-4">
          <p>Model confidence derived from data similarity.</p>
        </div>
      </div>
    </ScrollArea>
  );
}
