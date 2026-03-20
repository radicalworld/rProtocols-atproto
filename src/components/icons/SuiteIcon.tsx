import React from 'react';

export function SuiteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" {...props}>
      <circle cx="50" cy="24" r="12" stroke="currentColor" strokeWidth="6"/>
      <circle cx="26" cy="70" r="12" stroke="currentColor" strokeWidth="6"/>
      <circle cx="74" cy="70" r="12" stroke="currentColor" strokeWidth="6"/>
      <path d="M50 36V48" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <path d="M50 48L33 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M50 48L67 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
