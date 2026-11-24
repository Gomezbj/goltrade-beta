
import React from 'react';

interface UserGroupIconProps {
  className?: string;
}

const UserGroupIcon: React.FC<UserGroupIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.054 1.02.098 1.53.132m-2.098.852c-.676.028-1.35.028-2.028 0m-2.098.852c.676.028 1.35.028 2.028 0m.676 4.474c.676.028 1.35.028 2.028 0m6.101-4.474c.676.028 1.35.028 2.028 0m-2.098.852c.676.028 1.35.028 2.028 0m-6.772 4.474c.676.028 1.35.028 2.028 0m-2.098.852c.676.028 1.35.028 2.028 0M12 8c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm6 5c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM6 13c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
  </svg>
);

export default UserGroupIcon;
