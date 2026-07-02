import React from 'react';

const VerifiedBadge = ({ type = 'blue', size = 16, className = "" }) => {
  if (type === 'official') {
    return (
      <div className={`inline-flex items-center justify-center bg-gradient-to-br from-[#FF0000] to-[#CC0000] rounded-sm px-1.5 py-[2px] ml-1 shadow-sm border border-red-800/20 ${className}`}>
        <span className="text-white text-[10px] font-black tracking-widest uppercase leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
          OFFICIAL
        </span>
      </div>
    );
  }

  // The true scalloped rosette path (Instagram/Twitter shape) on a 24x24 canvas
  const rosettePath = "M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.92-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.92 1.788-3.92 3.998 0 .493.084.963.238 1.398-1.274.65-2.148 2.02-2.148 3.6 0 1.46.74 2.725 1.844 3.397-.076.326-.115.658-.115.996 0 2.21 1.71 3.998 3.92 3.998.406 0 .8-.076 1.172-.213C8.89 21.68 10.36 22.5 12 22.5c1.64 0 3.11-.82 3.682-2.115.372.136.766.212 1.172.212 2.21 0 3.92-1.788 3.92-3.998 0-.338-.04-.67-.116-.996 1.103-.672 1.843-1.936 1.843-3.396z";

  let fillColors = {};
  switch (type) {
    case 'gold':
      fillColors = { start: "#FFDF00", mid: "#FFC200", end: "#B8860B" };
      break;
    case 'gray':
    case 'grey':
      fillColors = { start: "#E1E8ED", mid: "#AAB8C2", end: "#657786" };
      break;
    case 'green':
      fillColors = { start: "#2EE59D", mid: "#1D976C", end: "#0F7A59" };
      break;
    case 'blue':
    default:
      fillColors = { start: "#70C2FF", mid: "#1DA1F2", end: "#0F7EE5" };
      break;
  }

  const gradientId = `badgeGradient-${type}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className} ml-0.5`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fillColors.start} />
            <stop offset="50%" stopColor={fillColors.mid} />
            <stop offset="100%" stopColor={fillColors.end} />
          </linearGradient>
        </defs>
        <path d={rosettePath} fill={`url(#${gradientId})`} />
        {/* Exact checkmark inside */}
        <path d="M7 12l3.5 3.5 6.5-7" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export default VerifiedBadge;
