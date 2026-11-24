import React from 'react';

interface RobotIconProps {
  className?: string;
}

const RobotIcon: React.FC<RobotIconProps> = ({ className = "w-6 h-6" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect x="5" y="8" width="14" height="10" rx="2" />
        <path d="M12 18v2" />
        <path d="M9 20h6" />
        <path d="M10 8V6a2 2 0 012-2h0a2 2 0 012 2v2" />
        <circle cx="9.5" cy="12.5" r=".5" fill="currentColor"/>
        <circle cx="14.5" cy="12.5" r=".5" fill="currentColor"/>
    </svg>
);

export default RobotIcon;
