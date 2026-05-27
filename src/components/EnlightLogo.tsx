import React from "react";

interface EnlightLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function EnlightLogo({ className = "", size = "md", showText = true }: EnlightLogoProps) {
  // Dimensions map
  const dimensions = {
    xs: "h-8 w-8",
    sm: "h-10 w-10",
    md: "h-20 w-20",
    lg: "h-36 w-36 sm:h-44 sm:w-44",
    xl: "h-48 w-48 sm:h-56 sm:w-56",
  };

  const dimClass = dimensions[size];

  // Mathematical generation of scalloped circle path with 32 scallops
  // Center is (250, 250); base radius is 220; scallop depth is 8
  const buildScallopPath = () => {
    const cx = 250;
    const cy = 250;
    const segments = 32;
    const rBase = 222;
    const rPeak = 232;
    let path = "";

    for (let i = 0; i <= segments; i++) {
      // Angle for start point
      const angle1 = (i * 2 * Math.PI) / segments;
      // Angle for control/peak point (halfway to next segment)
      const angleMid = ((i + 0.5) * 2 * Math.PI) / segments;
      // Angle for end point of segment
      const angle2 = ((i + 1) * 2 * Math.PI) / segments;

      const x1 = cx + rBase * Math.cos(angle1);
      const y1 = cy + rBase * Math.sin(angle1);
      
      const xMid = cx + rPeak * Math.cos(angleMid);
      const yMid = cy + rPeak * Math.sin(angleMid);
      
      const x2 = cx + rBase * Math.cos(angle2);
      const y2 = cy + rBase * Math.sin(angle2);

      if (i === 0) {
        path += `M ${x1} ${y1} Q ${xMid} ${yMid} ${x2} ${y2}`;
      } else {
        path += ` Q ${xMid} ${yMid} ${x2} ${y2}`;
      }
    }
    return path;
  };

  const scallopPath = buildScallopPath();

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`} id={`enlight-logo-container-${size}`}>
      <svg
        viewBox="0 0 500 500"
        className={`${dimClass} drop-shadow-md filter hover:scale-105 transition-transform duration-550 ease-out`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle paper/watercolor watercolor texture gradient */}
          <radialGradient id="enlightBg" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#FFF9F2" />
            <stop offset="60%" stopColor="#FBECD6" />
            <stop offset="100%" stopColor="#E9DBC2" />
          </radialGradient>

          {/* Candle wax gradient */}
          <linearGradient id="waxGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E0C3AB" />
            <stop offset="25%" stopColor="#F6E7D2" />
            <stop offset="70%" stopColor="#FFF9F0" />
            <stop offset="100%" stopColor="#D9BCA3" />
          </linearGradient>

          {/* Glowing candle flame gradient */}
          <linearGradient id="flameOuter" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF5722" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FF9800" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#FFEB3B" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>
          
          <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FF9800" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF5722" stopOpacity="0" />
          </radialGradient>

          {/* Golden double ring line gradient */}
          <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A07246" />
            <stop offset="50%" stopColor="#D49E6A" />
            <stop offset="100%" stopColor="#8C5C36" />
          </linearGradient>
        </defs>

        {/* 1. SCALLOPED EMBLEM BODY (The label sticker edge) */}
        <path
          d={scallopPath}
          fill="#FFFFFF"
          stroke="url(#ringGold)"
          strokeWidth="3.5"
          className="stroke-[3.5]"
          filter="drop-shadow(0px 3px 6px rgba(130, 110, 80, 0.15))"
        />

        {/* 2. INNER WATERCOLOR MEDALLION */}
        <circle cx="250" cy="250" r="212" fill="url(#enlightBg)" />

        {/* 3. DOUBLE BOUNDING RINGS */}
        <circle cx="250" cy="250" r="202" fill="none" stroke="url(#ringGold)" strokeWidth="1.2" strokeOpacity="0.8" />
        <circle cx="250" cy="250" r="198" fill="none" stroke="url(#ringGold)" strokeWidth="0.8" strokeOpacity="0.4" />

        {/* 4. REAL-TIME DETAILED LUXURY CANDLE PILLAR */}
        <g id="candle-illustration-group" className="transform translate-y-[35px]">
          {/* Flame Glow Aura */}
          <circle cx="236" cy="130" r="65" fill="url(#flameGlow)" className="animate-pulse" />

          {/* Candle Wick */}
          <path d="M 236,170 Q 236,145 233,132" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />

          {/* Animated Beautiful Candle Flame */}
          <g className="animate-[bounce_2s_infinite] origin-bottom" style={{ transformOrigin: "236px 145px" }}>
            {/* Outer flame */}
            <path
              d="M 236,80 C 223,110 216,132 222,145 C 227,153 236,155 242,154 C 250,153 255,145 251,132 C 247,110 236,80 236,80 Z"
              fill="url(#flameOuter)"
              className="drop-shadow-[0_0_8px_rgba(255,152,0,0.5)]"
            />
            {/* Inner flame */}
            <path
              d="M 236,105 C 229,122 226,132 229,141 C 231,146 236,147 239,147 C 244,146 247,141 245,132 C 242,122 236,105 236,105 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
          </g>

          {/* Candle Wax Cylinder Body */}
          {/* Top Ellipse (Wax surface depth) */}
          <ellipse cx="236" cy="180" rx="46" ry="12" fill="#E6CEBF" stroke="url(#ringGold)" strokeWidth="1" />
          {/* Main heavy cylinder */}
          <path
            d="M 190,180 C 190,180 190,270 190,285 C 190,295 210,302 236,302 C 262,302 282,295 282,285 L 282,180"
            fill="url(#waxGradient)"
            stroke="url(#ringGold)"
            strokeWidth="1.5"
          />
          {/* Shaded top lip */}
          <ellipse cx="236" cy="181" rx="45" ry="11" fill="#FBECD6" opacity="0.8" />
          
          {/* Shading/Highlights details for candle wax */}
          <path d="M 195,183 L 195,285" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" strokeLinecap="round" />
          <path d="M 277,183 L 277,285" stroke="#4E3629" strokeWidth="2.5" opacity="0.3" strokeLinecap="round" />
          <path d="M 210,186 Q 236,192 262,186" fill="none" stroke="#FFF" strokeWidth="1.5" opacity="0.35" />

          {/* Candle wick base detail */}
          <ellipse cx="236" cy="180" rx="3" ry="1" fill="#1A0D00" />
        </g>

        {/* 5. GORGEOUS BRUSH LETTERING "Enlight Candles" TYPE */}
        <text
          x="250"
          y="235"
          textAnchor="middle"
          fill="#352219"
          className="font-signature font-medium drop-shadow-sm select-none"
          style={{
            fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive",
            fontSize: "66px",
            fontWeight: "500",
          }}
        >
          Enlight Candles
        </text>

        {/* 6. ARC PATH FOR ROTATING CIRCULAR SUBTEXT */}
        {/* We craft an elegant downward arc sweep */}
        <path
          id="textArcPath"
          d="M 68,300 A 184,184 0 0 0 432,300"
          fill="none"
          stroke="none"
        />

        {/* 7. CIRCULAR SUBTEXT: "WHERE FRAGRANCE MEETS LUXURY" */}
        <text className="font-sans font-bold tracking-[0.24em] select-none uppercase">
          <textPath
            href="#textArcPath"
            startOffset="50%"
            textAnchor="middle"
            fill="#5C4033"
            style={{
              fontSize: "14.2px",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "5.5px",
            }}
          >
            WHERE FRAGRANCE MEETS LUXURY
          </textPath>
        </text>
      </svg>

      {showText && size !== "xs" && size !== "sm" && (
        <div className="text-center mt-3" id={`enlight-brand-label-${size}`}>
          <h1 className="font-serif text-lg md:text-2xl tracking-[0.16em] text-stone-900 font-bold uppercase">
            Enlight Candles
          </h1>
          <p className="font-sans text-[10px] md:text-xs tracking-[0.3em] text-stone-500 font-semibold uppercase mt-1">
            Where Fragrance Meets Luxury
          </p>
        </div>
      )}
    </div>
  );
}
