import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Grid } from '@react-three/drei';
import * as THREE from 'three';

// A random distribution of points inside a sphere for the cyber node effect
export const ParticleField = () => {
  const ref = useRef<THREE.Points>(null);

  // Generate random points
  const points = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Random spherical distribution
        const r = 10 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
        positions[i * 3 + 2] = r * Math.cos(phi); // z
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
        // Rotate the entire particle field slowly
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <>
      <group rotation={[0, 0, Math.PI / 4]}>
        <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#0ea5e9" /* Cyan-500 equivalent */
            size={0.05}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>
      <Grid 
        position={[0, -2, 0]} 
        args={[40, 40]} 
        cellSize={0.6} 
        cellThickness={1} 
        cellColor="#0ea5e9" 
        sectionSize={3} 
        sectionThickness={1.5} 
        sectionColor="#0284c7" 
        fadeDistance={25} 
        fadeStrength={1}
      />
    </>
  );
};

export default function CyberBackground3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <fog attach="fog" args={['#020617', 2, 10]} />
        <ambientLight intensity={0.5} />
        <ParticleField />
      </Canvas>
      {/* Dark overlay to make UI readable over particles */}
      <div className="absolute inset-0 bg-slate-950/60 transition-colors duration-1000"></div>
    </div>
  );
}
