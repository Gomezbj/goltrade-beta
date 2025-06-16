
import React from 'react';

interface PresentationChartBarIconProps {
  className?: string;
}

const PresentationChartBarIcon: React.FC<PresentationChartBarIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5V3m-3 13.5h.008v.008H9v-.008zm0-3h.008v.008H9v-.008zm0-3h.008v.008H9v-.008zm0-3h.008v.008H9v-.008zM12 16.5h.008v.008H12v-.008zm0-3h.008v.008H12v-.008zm0-3h.008v.008H12v-.008zm0-3h.008v.008H12v-.008zM15 16.5h.008v.008H15v-.008zm0-3h.008v.008H15v-.008zm0-3h.008v.008H15v-.008zm0-3h.008v.008H15v-.008z" />
  </svg>
);

export default PresentationChartBarIcon;