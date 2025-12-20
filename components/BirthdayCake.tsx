
import React, { useMemo } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // 17 candles
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => ({
    id: i,
    color: ['#FF69B4', '#FFB6C1', '#FFD700', '#87CEEB'][i % 4], // Varied colors
    height: 40 + Math.random() * 10, // Slight height variation
    x: Math.cos((i / 17) * Math.PI * 2) * 45, // Circular distribution X
    y: Math.sin((i / 17) * Math.PI * 2) * 20  // Circular distribution Y (squashed for 3D)
  })), []);

  return (
    <div className="relative mt-32 w-[350px] h-[300px] md:w-[450px] md:h-[350px] mx-auto select-none">
      
      {/* --- PLATE --- */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[30%] bg-gradient-to-b from-gray-100 to-gray-300 rounded-[100%] shadow-2xl border-4 border-white flex items-center justify-center z-0">
         <div className="w-[90%] h-[90%] bg-gradient-to-tr from-gray-50 to-gray-200 rounded-[100%] shadow-inner"></div>
      </div>

      {/* --- KNIFE (SVG) --- */}
      <div className="absolute bottom-2 -right-12 w-32 md:w-48 z-10 opacity-90 drop-shadow-lg">
        <svg viewBox="0 0 100 20" className="transform rotate-12">
          <path d="M0,8 Q50,0 90,8 L100,10 L90,12 Q50,20 0,12 Z" fill="#C0C0C0" stroke="#999" strokeWidth="1" />
          <rect x="-10" y="6" width="30" height="8" rx="2" fill="#5D4037" />
          <circle cx="-5" cy="10" r="1" fill="#8D6E63"/>
          <circle cx="5" cy="10" r="1" fill="#8D6E63"/>
        </svg>
      </div>

      {/* --- BOTTOM CAKE LAYER (Chocolate) --- */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-full h-[120px] z-10">
        {/* Side */}
        <div className="absolute bottom-0 w-full h-full bg-gradient-to-r from-[#3E2723] via-[#5D4037] to-[#3E2723] rounded-b-[50%] shadow-lg"></div>
        {/* Top (Lid) */}
        <div className="absolute top-0 w-full h-[60px] bg-[#4E342E] rounded-[50%] -translate-y-1/2 shadow-inner"></div>
      </div>

      {/* --- TOP CAKE LAYER (Cream/Yellow) --- */}
      <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-[85%] h-[110px] z-20">
        {/* Side */}
        <div className="absolute bottom-0 w-full h-full bg-gradient-to-r from-[#FFF9C4] via-[#FFF176] to-[#FFF9C4] rounded-b-[50%] shadow-md flex items-center justify-center overflow-hidden">
            {/* Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            {/* Text - Curved illusion via translateY */}
            <div className="font-['Great_Vibes'] text-4xl md:text-5xl text-[#D81B60] mt-8 transform rotate-x-12 z-20 drop-shadow-sm tracking-wide">
                My Babyyy
            </div>
            {/* Gold Badge Decoration */}
            <div className="absolute bottom-2 w-12 h-16 bg-gradient-to-tr from-yellow-400 to-yellow-200 rounded-full shadow-lg border border-yellow-600"></div>
        </div>
        
        {/* Top (Lid) - The Surface */}
        <div className="absolute top-0 w-full h-[60px] bg-[#FFFDE7] rounded-[50%] -translate-y-1/2 shadow-inner border-[1px] border-[#FFF59D] flex items-center justify-center">
            
            {/* Frosting Rim */}
            <div className="absolute inset-[-2px] rounded-[50%] border-4 border-white opacity-60 blur-[1px]"></div>

            {/* --- CANDLES --- */}
            <div className="absolute w-full h-full">
              {candles.map((c, i) => {
                 // Adjust z-index based on Y position (pseudo-3D sorting)
                 // Higher Y (closer to bottom of oval) should be higher Z
                 const zIndex = Math.floor(c.y + 50);
                 const isExtinguished = i < candlesExtinguished;

                 return (
                  <div 
                    key={i}
                    className="absolute"
                    style={{
                        left: `calc(50% + ${c.x}%)`,
                        top: `calc(50% + ${c.y}%)`,
                        zIndex: zIndex,
                        transform: 'translate(-50%, -100%)' // Anchor at bottom
                    }}
                  >
                     {/* Flame */}
                     <div 
                        className={`absolute bottom-full left-1/2 -translate-x-1/2 w-3 h-6 rounded-[50%_50%_20%_20%] 
                                   bg-gradient-to-t from-orange-500 via-yellow-300 to-white 
                                   animate-flicker-real shadow-[0_0_15px_rgba(255,200,0,0.8)]
                                   transition-all duration-300 ${isExtinguished ? 'opacity-0 scale-0' : 'opacity-100'}`}
                     ></div>

                     {/* Wick */}
                     <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 w-[2px] h-2 bg-black opacity-50"></div>

                     {/* Body */}
                     <div 
                        className="w-2 md:w-3 shadow-sm rounded-sm"
                        style={{
                            height: `${c.height}px`,
                            background: `linear-gradient(90deg, rgba(255,255,255,0.4), ${c.color}, rgba(0,0,0,0.2))`
                        }}
                     ></div>
                  </div>
                 );
              })}
            </div>

            {/* Sparkles Overlay */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
                {/* Static sparkles for magic effect */}
                <div className="absolute top-0 left-10 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse"></div>
                <div className="absolute bottom-2 right-10 w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_10px_gold] animate-pulse delay-75"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
