'use client';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Environment, PresentationControls } from '@react-three/drei';

function GeometricShapes() {
  const mainRef = useRef();
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.2;
    }
    if (mainRef.current) {
      mainRef.current.rotation.x = t * 0.3;
      mainRef.current.rotation.y = t * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main shape: Brain/Dodecahedron */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={mainRef} position={[0, 0, 0]}>
          <dodecahedronGeometry args={[1.5, 0]} />
          {/* Main solid */}
          <meshStandardMaterial 
            color="#FFF8F0" 
            metalness={0.1}
            roughness={0.8}
            polygonOffset
            polygonOffsetFactor={1}
          />
          {/* Wireframe border */}
          <mesh>
            <dodecahedronGeometry args={[1.51, 0]} />
            <meshBasicMaterial color="#1A1A2E" wireframe wireframeLinewidth={3} />
          </mesh>
        </mesh>
      </Float>

      {/* Floating accent shape 1: Coral Torus */}
      <Float speed={3} rotationIntensity={2} floatIntensity={3}>
        <mesh position={[2, 1.5, -1]}>
          <torusGeometry args={[0.4, 0.15, 16, 32]} />
          <meshStandardMaterial color="#FF6B6B" />
          <mesh>
            <torusGeometry args={[0.42, 0.16, 16, 32]} />
            <meshBasicMaterial color="#1A1A2E" wireframe />
          </mesh>
        </mesh>
      </Float>

      {/* Floating accent shape 2: Sunny Octahedron */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[-2, -1, 1]}>
          <octahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#FFD93D" />
          <mesh>
            <octahedronGeometry args={[0.62, 0]} />
            <meshBasicMaterial color="#1A1A2E" wireframe />
          </mesh>
        </mesh>
      </Float>

      {/* Floating accent shape 3: Mint Icosahedron */}
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2}>
        <mesh position={[1.5, -1.5, 1.5]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#6BCB77" />
          <mesh>
            <icosahedronGeometry args={[0.52, 0]} />
            <meshBasicMaterial color="#1A1A2E" wireframe />
          </mesh>
        </mesh>
      </Float>
    </group>
  );
}

export default function ThreeGlobe() {
  return (
    <div className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <PresentationControls 
          global 
          config={{ mass: 2, tension: 500 }} 
          snap={{ mass: 4, tension: 1500 }} 
          rotation={[0, 0, 0]} 
          polar={[-Math.PI / 3, Math.PI / 3]} 
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <GeometricShapes />
        </PresentationControls>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
