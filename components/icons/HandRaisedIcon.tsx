
import React from 'react';

interface HandRaisedIconProps {
  className?: string;
}

const HandRaisedIcon: React.FC<HandRaisedIconProps> = ({ className = "w-6 h-6" }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25v3.75m6 0M12 15.75V21m-3.375-6.375S6.75 15.75 5.25 15.75c-1.5 0-3 1.125-3 2.625V21m16.5 0v-2.625c0-1.5-1.5-2.625-3-2.625s-3.375 2.25-3.375 3.75V21m-9-12.75h9A2.25 2.25 0 0015.75 9V5.25a2.25 2.25 0 00-2.25-2.25h-3A2.25 2.25 0 008.25 5.25v3.75" />
</svg>
);

export default HandRaisedIcon;