import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, OrbitControls, Float, Sparkles, PerspectiveCamera } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

interface TextProps {
  text: string;
  position?: [number, number, number];
  color?: string;
}

const AnimatedText: React.FC<TextProps> = ({ 
  text, 
  position = [0, 0, 0], 
  color = '#00a6ff' 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  // Animation on scroll
  useEffect(() => {
    if (!meshRef.current) return;
    
    gsap.to(meshRef.current.rotation, {
      y: Math.PI * 2,
      scrollTrigger: {
        trigger: '#hero-section',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });
  }, []);

  // Continuous floating animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  // Responsive size based on viewport
  const fontSize = viewport.width < 5 ? 0.1 : 0.4;

  return (
    <mesh ref={meshRef} position={position}>
      <Text3D
        font="/fonts/inter-bold.json" // This would be a real font in production
        size={fontSize}
        height={0.1}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.01}
        bevelSize={0.01}
        bevelOffset={0}
        bevelSegments={5}
      >
        {text}
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Text3D>
    </mesh>
  );
};

const Scene: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.15} 
        penumbra={1} 
        intensity={1}
        castShadow 
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <Float
        speed={2}
        rotationIntensity={0.2}
        floatIntensity={0.5}
      >
        <AnimatedText 
          text="DATA-TECH" 
          position={[0, 0, 0]} 
          color={theme === 'dark' ? '#00a6ff' : '#0090e0'} 
        />
      </Float>
      
      <Sparkles 
        count={50} 
        scale={6} 
        size={2} 
        speed={0.3} 
        color={theme === 'dark' ? '#9d4edd' : '#8c35c8'} 
      />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        rotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
};

interface DataTechTextProps {
  className?: string;
}

const DataTechText: React.FC<DataTechTextProps> = ({ className = '' }) => {
  return (
    <div className={`${className}`}>
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
};

export default DataTechText;