import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Octahedron, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface ThreatShieldProps {
  threatLevel: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';
}

const ThreatCore = ({ threatLevel }: ThreatShieldProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Define colors and animation based on threat level
  let color = '#3b82f6'; // Unknown (Blue)
  let distort = 0.2;
  let speed = 1;
  let scale = 1;

  if (threatLevel === 'Safe') {
    color = '#22c55e'; // Green
    distort = 0.1;
    speed = 0.5;
  } else if (threatLevel === 'Suspicious') {
    color = '#eab308'; // Yellow
    distort = 0.5;
    speed = 3;
    scale = 1.1;
  } else if (threatLevel === 'Malicious') {
    color = '#ef4444'; // Red
    distort = 0.8;
    speed = 6;
    scale = 1.2;
  }

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (threatLevel === 'Malicious') {
        // Frantic shaking for malicious
        meshRef.current.rotation.x += delta * 4;
        meshRef.current.rotation.y += delta * 4;
      } else {
        // Smooth rotation
        meshRef.current.rotation.x += delta;
        meshRef.current.rotation.y += delta;
      }
    }
  });

  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={threatLevel === 'Malicious' ? 3 : 1}>
      <Octahedron ref={meshRef} args={[1.5, 0]} scale={scale}>
        <MeshDistortMaterial
          color={color}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.8}
          roughness={0.2}
          distort={distort}
          speed={speed}
        />
      </Octahedron>
    </Float>
  );
};

export default function ThreatShield3D({ threatLevel }: ThreatShieldProps) {
  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center relative pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />
        <ThreatCore threatLevel={threatLevel} />
      </Canvas>
    </div>
  );
}
