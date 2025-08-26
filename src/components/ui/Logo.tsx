import React from 'react';
import { Cpu } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Cpu className="text-primary-500 mr-2 h-full" />
      <span className="font-display font-bold text-xl md:text-2xl">
        <span className="text-primary-500">DATA</span>
        <span className="text-secondary-500">-</span>
        <span className="text-accent-500">TECH</span>
      </span>
    </div>
  );
};

export default Logo;