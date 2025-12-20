import React, { useMemo, useState, useEffect } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // 17 candles
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => ({
    id: i,
    color: ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'][i % 4], 
    height: 40 + Math.random() * 10,
    // Distribute nicely on the oval
    x: Math.cos((i / 17) * Math.PI * 2) * 42,
    y: Math.sin((i / 17) * Math.PI * 2) * 18
  })), []);

  // Track previous extinguished count to trigger smoke
  const [smokeList, setSmokeList] = useState<number[]>([]);
  useEffect(() => {
    if (candlesExtinguished > 0) {
       // Add smoke indices for newly extinguished candles
       const newSmokes = Array.from({length: candlesExtinguished}).map((_, i) => i).filter(i => !smokeList.includes(i));
       if(newSmokes.length > 0) {
           setSmokeList(prev => [...prev, ...newSmokes]);
       }
    }
  }, [candlesExtinguished]);

  return (
    <div className="relative mt-24 w-[350px] h-[300px] md:w-[450px] md:h-[350px] mx-auto select-none perspective-[1000px]">
      
      {/* --- PLATE --- */}
      <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[130%] h-[35%] z-0">
         <div className="w-full h-full bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-[50%] shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center">
            <div className="w-[90%] h-[90%] rounded-[50%] border border-gray-200 bg-gradient-to-tr from-gray-50 to-white shadow-inner"></div>
         </div>
         {/* Reflection */}
         <div className="absolute top-[20%] right-[20%] w-[15%] h-[10%] bg-white blur-sm rounded-full opacity-60"></div>
      </div>

      {/* --- KNIFE --- */}
      <div className="absolute bottom-4 -right-16 w-40 z-10 opacity-90 drop-shadow-xl transition-transform hover:rotate-3 duration-300">
        <svg viewBox="0 0 100 20" className="transform rotate-[15deg] origin-left">
          <defs>
            <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#bdbdbd" />
            </linearGradient>
          </defs>
          <path d="M0,8 Q50,2 90,8 L100,10 L90,12 Q50,18 0,12 Z" fill="url(#bladeGrad)" stroke="#9e9e9e" strokeWidth="0.5" />
          <rect x="-15" y="6" width="35" height="8" rx="2" fill="#5D4037" />
          <circle cx="-10" cy="10" r="1" fill="#8D6E63"/>
          <circle cx="0" cy="10" r="1" fill="#8D6E63"/>
        </svg>
      </div>

      {/* --- BOTTOM CAKE LAYER (Chocolate) --- */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-full h-[100px] z-10">
        {/* Side with Texture */}
        <div className="absolute bottom-0 w-full h-full bg-[#4E342E] rounded-b-[50%] shadow-xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[#3E2723] via-[#5D4037] to-[#3E2723]"></div>
             <div className="absolute inset-0 sponge-texture opacity-30 mix-blend-overlay"></div>
        </div>
        {/* Top (Lid) */}
        <div className="absolute top-0 w-full h-[60px] bg-[#3E2723] rounded-[50%] -translate-y-1/2 shadow-inner border-b border-[#5D4037]"></div>
      </div>

      {/* --- TOP CAKE LAYER (Cream/Yellow) --- */}
      <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-[85%] h-[110px] z-20">
        {/* Side */}
        <div className="absolute bottom-0 w-full h-full bg-[#FFF9C4] rounded-b-[50%] shadow-lg flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9C4] via-[#FFF59D] to-[#FFF9C4]"></div>
            <div className="absolute inset-0 sponge-texture opacity-20 mix-blend-multiply"></div>
            
            {/* Decorative Swirls Bottom */}
            <div className="absolute bottom-[-10px] w-full h-[20px] flex justify-center space-x-2 opacity-50">
                {Array.from({length: 12}).map((_,i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-4 border-[#FDD835] bg-transparent transform -translate-y-1/2"></div>
                ))}
            </div>

            {/* Text */}
            <div className="font-['Great_Vibes'] text-4xl md:text-5xl text-[#D81B60] mt-6 transform rotate-x-12 z-20 drop-shadow-sm tracking-wide">
                My Babyyy
            </div>
        </div>
        
        {/* Top (Lid) - The Surface */}
        <div className="absolute top-0 w-full h-[60px] bg-[#FFFDE7] rounded-[50%] -translate-y-1/2 shadow-inner border-[1px] border-[#FFF59D] flex items-center justify-center">
            
            {/* Frosting Swirls Rim */}
            <div className="absolute inset-[-4px] rounded-[50%] border-[6px] border-dotted border-[#FFF59D] opacity-80"></div>

            {/* --- PANDA DECORATION (Center) --- */}
            <div className="absolute z-10 w-16 h-12 bg-white rounded-full shadow-md flex items-center justify-center transform -translate-y-2">
                 {/* Ears */}
                 <div className="absolute -top-1 -left-1 w-5 h-5 bg-black rounded-full"></div>
                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full"></div>
                 {/* Face */}
                 <div className="relative w-full h-full bg-white rounded-full border border-gray-100 z-10 flex flex-col items-center justify-center">
                     <div className="flex gap-2 mt-1">
                         <div className="w-3 h-3 bg-black rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                         <div className="w-3 h-3 bg-black rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                     </div>
                     <div className="w-2 h-1 bg-black rounded-full mt-1"></div>
                     <div className="w-2 h-2 border-b-2 border-black rounded-full"></div>
                 </div>
            </div>

            {/* --- CANDLES --- */}
            <div className="absolute w-full h-full">
              {candles.map((c, i) => {
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
                        transform: 'translate(-50%, -100%)'
                    }}
                  >
                     {/* Flame */}
                     <div 
                        className={`absolute bottom-full left-1/2 -translate-x-1/2 w-3 h-7 rounded-[50%_50%_20%_20%] 
                                   bg-gradient-to-t from-orange-600 via-yellow-400 to-white 
                                   animate-flicker-real shadow-[0_0_20px_rgba(255,200,0,0.6)] mix-blend-screen
                                   transition-all duration-300 ${isExtinguished ? 'opacity-0 scale-0' : 'opacity-100'}`}
                     ></div>

                     {/* Smoke (when extinguished) */}
                     {isExtinguished && (
                         <div className="absolute bottom-full left-1/2 w-4 h-4 bg-gray-400 rounded-full blur-sm animate-smoke pointer-events-none"></div>
                     )}

                     {/* Wick */}
                     <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-gray-800"></div>

                     {/* Candle Body */}
                     <div 
                        className="w-2.5 shadow-md rounded-[2px]"
                        style={{
                            height: `${c.height}px`,
                            background: `linear-gradient(90deg, rgba(255,255,255,0.6), ${c.color}, rgba(0,0,0,0.1))`
                        }}
                     ></div>
                  </div>
                 );
              })}
            </div>
        </div>
      </div>
    </div>
  );
};