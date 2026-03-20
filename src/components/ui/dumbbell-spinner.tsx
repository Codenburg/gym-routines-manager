"use client";

export function DumbbellSpinner({ size = 80, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        animation: 'spin 1.5s linear infinite',
      }}
    >
      <defs>
        {/* Red gradient that will animate */}
        <linearGradient id="dumbbellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444">
            <animate
              attributeName="stop-color"
              values="#ef4444;#dc2626;#ef4444"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#b91c1c">
            <animate
              attributeName="stop-color"
              values="#b91c1c;#991b1b;#b91c1c"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
        
        {/* Shadow filter for depth */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Rotating group */}
      <g filter="url(#glow)">
        {/* Left weight (hexagonal shape) */}
        <path
          d="M15 35 L25 35 L25 65 L15 65 Z"
          fill="url(#dumbbellGradient)"
          stroke="#7f1d1d"
          strokeWidth="1"
        />
        <path
          d="M10 40 L20 40 L20 60 L10 60 Z"
          fill="url(#dumbbellGradient)"
          stroke="#7f1d1d"
          strokeWidth="1"
        />
        
        {/* Right weight (hexagonal shape) */}
        <path
          d="M75 35 L85 35 L85 65 L75 65 Z"
          fill="url(#dumbbellGradient)"
          stroke="#7f1d1d"
          strokeWidth="1"
        />
        <path
          d="M80 40 L90 40 L90 60 L80 60 Z"
          fill="url(#dumbbellGradient)"
          stroke="#7f1d1d"
          strokeWidth="1"
        />
        
        {/* Bar */}
        <rect
          x="20"
          y="47"
          width="60"
          height="6"
          rx="2"
          fill="url(#dumbbellGradient)"
          stroke="#7f1d1d"
          strokeWidth="0.5"
        />
        
        {/* Grip texture on bar */}
        <rect x="35" y="48" width="30" height="4" fill="#7f1d1d" opacity="0.5"/>
      </g>
    </svg>
  );
}
