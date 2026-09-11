import React from 'react';
import normiLogo from '../normi-logo.jpg';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img 
        src={normiLogo} 
        alt="NMC Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
