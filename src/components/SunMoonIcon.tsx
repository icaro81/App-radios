import React from 'react';

interface SunMoonIconProps {
  className?: string;
  size?: number;
}

/**
 * Minimalist single-stroke (un trazo) Sun and Moon icon:
 * A central circle with single-stroke sun rays and crescent moon dividing curve.
 */
export const SunMoonIcon: React.FC<SunMoonIconProps> = ({ className = 'w-5 h-5', size = 20 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Sun rays on perimeter in a single stroke */}
      <path d="M12 2v2.5" />
      <path d="m18.5 5.5-1.75 1.75" />
      <path d="M22 12h-2.5" />
      <path d="m18.5 18.5-1.75-1.75" />
      <path d="M12 22v-2.5" />

      {/* Circle body */}
      <circle cx="12" cy="12" r="5" />

      {/* Moon crescent interior arc in a single stroke */}
      <path d="M12 7a4 4 0 0 1 0 10" />
    </svg>
  );
};
