import React from 'react';
import { Sector } from '../types';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  sector?: Sector;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md", sector = Sector.EXCISE }) => {
  const sizeClasses = {
    sm: "h-10 w-10 p-1.5",
    md: "h-14 w-14 p-2",
    lg: "h-32 w-32 p-4",
    xl: "h-64 w-64 p-8"
  };

  const sectorColors = {
    [Sector.EXCISE]: {
      primary: '#4f46e5', // Indigo 600
      secondary: '#3730a3', // Indigo 800
      accent: '#818cf8', // Indigo 400
      accentDark: '#4338ca'
    },
    [Sector.PHARMA]: {
      primary: '#2563eb', // Blue 600
      secondary: '#1e40af', // Blue 800
      accent: '#60a5fa', // Blue 400
      accentDark: '#1d4ed8'
    },
    [Sector.FMCG]: {
      primary: '#059669', // Emerald 600
      secondary: '#065f46', // Emerald 800
      accent: '#34d399', // Emerald 400
      accentDark: '#047857'
    },
    [Sector.AGRICULTURE]: {
      primary: '#d97706', // Amber 600
      secondary: '#92400e', // Amber 800
      accent: '#fbbf24', // Amber 400
      accentDark: '#b45309'
    },
    [Sector.TEXTILE]: {
      primary: '#e11d48', // Rose 600
      secondary: '#9f1239', // Rose 800
      accent: '#fb7185', // Rose 400
      accentDark: '#be123c'
    },
    [Sector.GENERAL]: {
      primary: '#475569', // Slate 600
      secondary: '#1e293b', // Slate 800
      accent: '#94a3b8', // Slate 400
      accentDark: '#334155'
    }
  };

  const colors = sectorColors[sector] || sectorColors[Sector.GENERAL];

  const cx = 250;
  const cy = 250;
  const R = 180;
  const innerR = 0.62 * R;

  const getPoint = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const pOuterStart = getPoint(R, 0); 
  const pOuterEnd = getPoint(R, 60);     
  const pInnerStart = getPoint(innerR, 0); 
  const pInnerEnd = getPoint(innerR, 60);     

  const ringPath = `
    M ${pOuterEnd.x},${pOuterEnd.y}
    A ${R},${R} 0 1,1 ${pOuterStart.x},${pOuterStart.y}
    L ${pInnerStart.x},${pInnerStart.y}
    A ${innerR},${innerR} 0 1,0 ${pInnerEnd.x},${pInnerEnd.y}
    Z
  `;

  const trianglePath = `
    M ${cx},${cy}
    L ${getPoint(R, -45).x},${getPoint(R, -45).y}
    L ${getPoint(R, 0).x},${getPoint(R, 0).y}
    Z
  `;

  const hexW = 140; 
  const hexH = 68.75;  
  const edge = 34.375;

  const hexSlabPath = `
    M ${-hexW/2},0
    L ${-hexW/2 + edge},${-hexH/2}
    L ${hexW/2 - edge},${-hexH/2}
    L ${hexW/2},0
    L ${hexW/2 - edge},${hexH/2}
    L ${-hexW/2 + edge},${hexH/2}
    Z
  `;

  const GRID_GAP = 12; 
  const vStep = (hexH + GRID_GAP) / 2;
  const hColOffset = (hexW - edge) + GRID_GAP;

  const targetCx = 399.25; 
  const targetCy = 262;

  const blockPositions = [
    { x: targetCx, y: targetCy },
    { x: targetCx - hColOffset, y: targetCy + vStep }, 
    { x: targetCx, y: targetCy + (vStep * 2) },
    { x: targetCx - hColOffset, y: targetCy + (vStep * 3) },
  ];

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 bg-white rounded-full shadow-sm ${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.accentDark} />
            <stop offset="50%" stopColor={colors.accent} />
            <stop offset="100%" stopColor={colors.accentDark} />
          </linearGradient>
          <clipPath id="hexClip">
            <path d={hexSlabPath} />
          </clipPath>
          <filter id="brandingShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feOffset dx="-9" dy="9" in="blur" result="offsetBlur" />
            <feFlood floodColor="#000" floodOpacity="0.12" result="color" />
            <feComposite in="color" in2="offsetBlur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#brandingShadow)">
          <path d={ringPath} fill="url(#primaryGrad)" />
          <path d={trianglePath} fill="url(#primaryGrad)" />

          {blockPositions.map((pos, i) => (
            <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
              <path d={hexSlabPath} fill="#ffffff" />
              <g clipPath="url(#hexClip)">
                <path 
                  d={hexSlabPath} 
                  fill="none" 
                  stroke="url(#accentGrad)" 
                  strokeWidth="20" 
                  strokeLinejoin="round"
                />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default Logo;
