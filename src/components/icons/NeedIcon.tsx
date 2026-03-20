import React from 'react';

export function NeedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" {...props}>
      <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="8"/>
      <circle cx="50" cy="50" r="10" fill="currentColor"/>
    </svg>
  );
}
