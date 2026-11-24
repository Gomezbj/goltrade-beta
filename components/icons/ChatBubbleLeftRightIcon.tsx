
import React from 'react';

interface ChatBubbleLeftRightIconProps {
  className?: string;
}

const ChatBubbleLeftRightIcon: React.FC<ChatBubbleLeftRightIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.373c-.65.065-.99.75-.815 1.355l.75 2.507c.175.585-.223 1.205-.796 1.205a.75.75 0 01-.75-.75v-4.532c0-.573-.25-1.11-.688-1.486l-4.402-4.116a.75.75 0 010-1.06l4.402-4.116c.438-.376.688-.913.688-1.486V3.64c0-.414.336-.75.75-.75h.008c.573 0 .971.62.796 1.205l-.75 2.507c-.175.605.165 1.29.815 1.355l3.722.373zM3.75 12h.008v.008H3.75V12zM6.375 12h.008v.008H6.375V12zM9 12h.008v.008H9V12z" />
  </svg>
);

export default ChatBubbleLeftRightIcon;
