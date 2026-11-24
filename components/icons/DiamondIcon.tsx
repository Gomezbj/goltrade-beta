
import React from 'react';

interface DiamondIconProps {
  className?: string;
}

const DiamondIcon: React.FC<DiamondIconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2L1 12l11 10 11-10L12 2z" />
  </svg>
);

export default DiamondIcon;
