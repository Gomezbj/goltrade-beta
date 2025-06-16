
import React from 'react';

interface TrophyIconProps {
  className?: string;
}

const TrophyIcon: React.FC<TrophyIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 9.75H11.25A3.375 3.375 0 007.5 13.125V18.75m0-4.5h6.75C16.81 14.25 15 11.251 15 9.375A3.375 3.375 0 0011.625 6H12.375A3.375 3.375 0 0015.75 2.625h-7.5A3.375 3.375 0 004.875 6H5.625A3.375 3.375 0 009 9.375c0 1.876-1.81 4.875-4.5 4.875H3.75" />
  </svg>
);

export default TrophyIcon;