
import React from 'react';

interface PresentationChartLineIconProps {
  className?: string;
}

const PresentationChartLineIcon: React.FC<PresentationChartLineIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25v3.75A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18v-3.75M3.75 14.25H20.25M12 17.25h.008v.008H12v-.008zm0-4.5h.008v.008H12v-.008zM7.5 7.5h5.25m-5.25 3h5.25" />
  </svg>
);

export default PresentationChartLineIcon;