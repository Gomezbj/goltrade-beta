
import React from 'react';

interface LightbulbIconProps {
  className?: string;
}

const LightbulbIcon: React.FC<LightbulbIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.002 6.002 0 00-5.032-5.908 5.95 5.95 0 01-1.408-.707 6.002 6.002 0 00-5.133 5.81V18a3 3 0 003 3h1.596A6.002 6.002 0 0012 18zm0 0a6.002 6.002 0 015.032-5.908 5.95 5.95 0 001.408-.707 6.002 6.002 0 015.133 5.81V18a3 3 0 01-3 3h-1.596A6.002 6.002 0 0112 18zM12 6.75A2.25 2.25 0 1112 2.25a2.25 2.25 0 010 4.5z" />
  </svg>
);

export default LightbulbIcon;