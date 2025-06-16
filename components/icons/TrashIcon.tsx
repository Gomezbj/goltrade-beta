
import React from 'react';

interface TrashIconProps {
  className?: string;
}

const TrashIcon: React.FC<TrashIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.096m7.124 0c-.317.025-.632.05-.944.075M5.25 6H4.875c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h14.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-13.5 0v-1.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V6m-4.5 0h4.5m-4.5 0h4.5" />
  </svg>
);

export default TrashIcon;