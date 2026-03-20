import React from 'react';

export function ProtocolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" {...props}>
      {/* Start node */}
      <circle cx="24" cy="28" r="8" stroke="currentColor" strokeWidth="6"/>
      
      {/* End node */}
      <circle cx="76" cy="72" r="8" stroke="currentColor" strokeWidth="6"/>
      
      {/* S-shaped path */}
      <path d="M32 32 
               C 48 20, 52 52, 68 44
               S 78 64, 68 68"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"/>
    </svg>
  );
}
