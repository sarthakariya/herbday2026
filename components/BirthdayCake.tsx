import React, { useMemo, useState, useEffect } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // 17 candles arranged in an oval
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => ({
    id: i,
    color: ['#ff80ab', '#82b1ff', '#ffff8d', '#b9f6ca'][i % 4], // Soft pastels
    height: 45 + Math.random() * 15,
    // Oval distribution
    x: Math.cos((i / 17) * Math.PI * 2) * 45,
    y: Math.sin((i / 17) * Math.PI * 2) * 20
  })), []);

  // Cherries for decoration (12 around the edge)
  const cherries = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    x: Math.cos((i / 12) * Math.PI * 2) * 46,
    y: Math.sin((i / 12) * Math.PI * 2) * 22
  })), []);

  return (
    <div className="relative mt-24 w-[350px] h-[300px] md:w-[450px] md:h-[350px] mx-auto select-none perspective-[1000px]">
      
      {/* --- PLATE (Porcelain) --- */}
      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[140%] h-[40%] z-0">
         <div className="w-full h-full bg-white rounded-[50%] shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-gray-100 flex items-center justify-center">
            {/* Inner rim */}
            <div className="w-[85%] h-[85%] rounded-[50%] border-2 border-gray-100 bg-gradient-to-br from-white via-[#f5f5f5] to-[#eeeeee] shadow-inner"></div>
            {/* Gold Trim */}
            <div className="absolute inset-0 rounded-[50%] border-[2px] border-[#ffd700] opacity-60"></div>
         </div>
         {/* Glossy Reflection */}
         <div className="absolute top-[15%] right-[20%] w-[20%] h-[15%] bg-white blur-md rounded-[50%] opacity-80"></div>
      </div>

      {/* --- KNIFE (Silverware) --- */}
      <div className="absolute bottom-0 -right-24 w-48 z-10 drop-shadow-2xl transition-transform hover:rotate-3 duration-500">
        <svg viewBox="0 0 120 25" className="transform rotate-[12deg] origin-left filter drop-shadow-lg">
          <defs>
            <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#9e9e9e" />
              <stop offset="100%" stopColor="#bdbdbd" />
            </linearGradient>
            <linearGradient id="woodHandle" x1="0" y1="0" x2="1" y2="0">
               <stop offset="0%" stopColor="#3E2723" />
               <stop offset="100%" stopColor="#5D4037" />
            </linearGradient>
          </defs>
          {/* Blade */}
          <path d="M30,10 Q80,2 110,10 L120,12 L110,14 Q80,20 30,14 Z" fill="url(#metalGrad)" stroke="#757575" strokeWidth="0.5" />
          {/* Handle */}
          <rect x="0" y="8" width="40" height="10" rx="3" fill="url(#woodHandle)" stroke="#281915" />
          {/* Rivets */}
          <circle cx="10" cy="13" r="1.5" fill="#D7CCC8"/>
          <circle cx="30" cy="13" r="1.5" fill="#D7CCC8"/>
        </svg>
      </div>

      {/* --- LAYER 1: BOTTOM (Chocolate) --- */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[110%] h-[120px] z-10">
        {/* Side */}
        <div className="absolute bottom-0 w-full h-full bg-[#3E2723] rounded-b-[50%] shadow-[inset_0_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[#281915] via-[#4E342E] to-[#281915]"></div>
             {/* Sponge Texture */}
             <div className="absolute inset-0 sponge-texture opacity-20 mix-blend-overlay"></div>
        </div>
        {/* Top Surface of Bottom Layer */}
        <div className="absolute top-0 w-full h-[70px] bg-[#4E342E] rounded-[50%] -translate-y-1/2 shadow-inner border-b border-[#3E2723]"></div>
      </div>

      {/* --- LAYER 2: TOP (Pink/Vanilla Cream) --- */}
      <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-[80%] h-[100px] z-20">
        {/* Side */}
        <div className="absolute bottom-0 w-full h-full bg-[#FCE4EC] rounded-b-[50%] shadow-lg flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F8BBD0] via-[#FCE4EC] to-[#F8BBD0]"></div>
            <div className="absolute inset-0 sponge-texture opacity-10 mix-blend-multiply"></div>
            
            {/* Frosting Drips */}
            <div className="absolute top-0 w-full flex justify-center">
                 {Array.from({length: 15}).map((_, i) => (
                     <div key={i} className="w-8 h-12 bg-white rounded-b-full mx-[-4px] shadow-sm transform scale-y-150 origin-top opacity-90"></div>
                 ))}
            </div>

            {/* Icing Text */}
            <div className="font-['Great_Vibes'] text-5xl text-[#e91e63] mt-8 transform rotate-x-6 z-20 drop-shadow-[1px_1px_0px_rgba(255,255,255,0.8)] tracking-wide">
                My Babyyy
            </div>
        </div>
        
        {/* Top Surface (Lid) */}
        <div className="absolute top-0 w-full h-[60px] bg-[#FFF3E0] rounded-[50%] -translate-y-1/2 shadow-inner border border-[#FFE0B2] flex items-center justify-center">
            
            {/* Frosting Rim */}
            <div className="absolute inset-0 rounded-[50%] border-[8px] border-[#FFF] opacity-90 shadow-sm"></div>

            {/* --- CHERRIES --- */}
            {cherries.map((c, i) => {
                 // Z-index calculation to hide behind candles or show in front
                 const zIndex = Math.floor(c.y + 40);
                 return (
                     <div key={i} className="absolute w-8 h-8 z-20"
                          style={{
                              left: `calc(50% + ${c.x}%)`,
                              top: `calc(50% + ${c.y}%)`,
                              zIndex: zIndex,
                              transform: 'translate(-50%, -80%)'
                          }}>
                          {/* Cherry Body */}
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ff1744] via-[#d50000] to-[#b71c1c] shadow-lg relative">
                               {/* Gloss */}
                               <div className="absolute top-1 left-2 w-3 h-2 bg-white rounded-full opacity-40 blur-[1px]"></div>
                          </div>
                          {/* Stem */}
                          <div className="absolute bottom-6 left-1/2 w-8 h-6 border-l-2 border-[#558b2f] rounded-[50%] transform -rotate-12 origin-bottom"></div>
                     </div>
                 );
            })}

            {/* --- CANDLES --- */}
            <div className="absolute w-full h-full">
              {candles.map((c, i) => {
                 const zIndex = Math.floor(c.y + 60);
                 const isExtinguished = i < candlesExtinguished;

                 return (
                  <div 
                    key={i}
                    className="absolute"
                    style={{
                        left: `calc(50% + ${c.x}%)`,
                        top: `calc(50% + ${c.y}%)`,
                        zIndex: zIndex,
                        transform: 'translate(-50%, -100%)'
                    }}
                  >
                     {/* Flame */}
                     <div 
                        className={`absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-4 h-9 rounded-[50%_50%_20%_20%] 
                                   bg-gradient-to-t from-blue-500 via-orange-400 to-yellow-200 
                                   animate-flicker-real shadow-[0_0_25px_rgba(255,160,0,0.8)] mix-blend-screen
                                   transition-all duration-300 ${isExtinguished ? 'opacity-0 scale-0' : 'opacity-100'}`}
                     >
                        {/* Inner Blue Core */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-blue-600 rounded-full blur-[1px] opacity-80"></div>
                     </div>

                     {/* Smoke (when extinguished) */}
                     {isExtinguished && (
                         <div className="absolute bottom-full left-1/2 w-6 h-6 bg-gray-400 rounded-full blur-md animate-smoke pointer-events-none opacity-50"></div>
                     )}

                     {/* Wick */}
                     <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 w-[2px] h-3 bg-black opacity-80"></div>

                     {/* Candle Body (Wax) */}
                     <div 
                        className="w-3 shadow-[2px_0_5px_rgba(0,0,0,0.3)] rounded-[2px]"
                        style={{
                            height: `${c.height}px`,
                            background: `linear-gradient(90deg, rgba(255,255,255,0.4), ${c.color}, rgba(0,0,0,0.15))`
                        }}
                     >
                         {/* Wax shine */}
                         <div className="absolute top-0 left-0.5 w-1 h-full bg-white opacity-30"></div>
                     </div>
                  </div>
                 );
              })}
            </div>
        </div>
      </div>
    </div>
  );
};
