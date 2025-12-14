import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Float, Environment } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useRef, useMemo } from "react";
import * as THREE from "three";

interface ElectrochemicalCell3DProps {
  stateOfHealth: number;
  testId?: string;
}

function SoHToColor(soh: number): string {
  if (soh >= 80) {
    const t = (soh - 80) / 20;
    const r = Math.round(34 + (1 - t) * 30);
    const g = Math.round(197 - (1 - t) * 50);
    const b = Math.round(94 - (1 - t) * 20);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (soh >= 50) {
    const t = (soh - 50) / 30;
    const r = Math.round(245 - t * 180);
    const g = Math.round(158 - t * 10 + t * 50);
    const b = Math.round(11 + t * 70);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = soh / 50;
    const r = Math.round(239 - (1 - t) * 20);
    const g = Math.round(68 + t * 90);
    const b = Math.round(68 - (1 - t) * 30);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function Electrolyte() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[3, 2.5, 2]} />
      <meshPhysicalMaterial
        color="#a8d8ea"
        transparent
        opacity={0.25}
        roughness={0.1}
        metalness={0}
        transmission={0.6}
        thickness={0.5}
      />
    </mesh>
  );
}

interface WorkingElectrodeProps {
  soh: number;
}

function WorkingElectrode({ soh }: WorkingElectrodeProps) {
  const color = useMemo(() => SoHToColor(soh), [soh]);

  return (
    <group position={[-0.8, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.15, 2, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.15}
        color="#666666"
        anchorX="center"
        anchorY="top"
      >
        Working
      </Text>
    </group>
  );
}

function CounterElectrode() {
  return (
    <group position={[0.8, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.15, 2, 1.5]} />
        <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.15}
        color="#666666"
        anchorX="center"
        anchorY="top"
      >
        Counter
      </Text>
    </group>
  );
}

function ReferenceElectrode() {
  return (
    <group position={[0, 0, 0.9]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.2]} />
        <meshStandardMaterial color="#c9c9c9" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.12]} />
        <meshPhysicalMaterial
          color="#e8e8e8"
          transparent
          opacity={0.7}
          roughness={0.1}
        />
      </mesh>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.15}
        color="#666666"
        anchorX="center"
        anchorY="top"
      >
        Reference
      </Text>
    </group>
  );
}

function CellContainer() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[3.2, 2.7, 2.2]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.1}
        roughness={0}
        metalness={0}
        transmission={0.9}
        thickness={0.2}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

interface BubblesProps {
  count?: number;
}

function Bubbles({ count = 15 }: BubblesProps) {
  const bubbles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 1.5,
      scale: 0.02 + Math.random() * 0.04,
      speed: 0.5 + Math.random() * 0.5,
    }));
  }, [count]);

  return (
    <>
      {bubbles.map((bubble) => (
        <Float
          key={bubble.id}
          speed={bubble.speed}
          rotationIntensity={0}
          floatIntensity={0.5}
          floatingRange={[-0.1, 0.1]}
        >
          <mesh position={[bubble.x, bubble.y, bubble.z]}>
            <sphereGeometry args={[bubble.scale]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.4}
              roughness={0}
              metalness={0}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Scene({ soh }: { soh: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.5} />

      <CellContainer />
      <Electrolyte />
      <WorkingElectrode soh={soh} />
      <CounterElectrode />
      <ReferenceElectrode />
      <Bubbles count={12} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.5}
      />
      <Environment preset="studio" />
    </>
  );
}

export function ElectrochemicalCell3D({ stateOfHealth, testId }: ElectrochemicalCell3DProps) {
  const controlsRef = useRef<any>(null);

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const sohColor = useMemo(() => SoHToColor(stateOfHealth), [stateOfHealth]);

  return (
    <Card className="border border-border" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg font-medium">3D Electrochemical Cell</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          data-testid="button-reset-3d-view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden">
          <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
            <Scene soh={stateOfHealth} />
          </Canvas>

          <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: sohColor }}
              />
              <span className="text-xs font-mono">
                Working Electrode: {stateOfHealth.toFixed(1)}% SoH
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-gray-400" />
              <span className="text-xs text-muted-foreground">Counter Electrode</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-gray-200" />
              <span className="text-xs text-muted-foreground">Reference Electrode</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
