
import React from 'react';

// A simplified representation of the flag of Spain.
const SpainFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M0 0H3V2H0z" fill="#C60B1E"/>
        <path d="M0 .5H3V1.5H0z" fill="#FFC400"/>
    </svg>
);

export default SpainFlagIcon;
