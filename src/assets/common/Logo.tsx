import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img 
        src="https://normi.edu.ph/wp-content/uploads/2021/04/NMC-Logo.png" 
        alt="NMC Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
