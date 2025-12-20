import React, { useMemo } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // 17 candles arranged in a circular pattern on top
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => {
    // True circular distribution
    const angle = (i / 17) * Math.PI * 2;
    // Radius relative to percentage of container
    const radius = 35; 
    return {
      id: i,
      color: ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'][i % 4], 
      height: 40 + Math.random() * 10,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }), []);

  // Cherries arranged in a circle
  const cherries = useMemo(() => Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 42; // Slightly wider than candles
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }), []);

  return (
    // Container is SQUARE (w=h) to ensure the cake is circular, not oval.
    // The perspective and rotateX in the CSS/parent will handle the view angle.
    <div className="relative mt-12 w-[350px] h-[350px] md:w-[400px] md:h-[400px] mx-auto select-none perspective-[1000px]">
      
      {/* --- PLATE (Porcelain) --- */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] z-0">
         <div className="w-full h-full bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-full shadow-[0_30px_50px_rgba(0,0,0,0.6)] border-[6px] border-white flex items-center justify-center">
            {/* Inner Gold Rim */}
            <div className="w-[95%] h-[95%] rounded-full border border-yellow-500/30"></div>
            {/* Gloss Reflection */}
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[20%] bg-white rounded-full opacity-40 blur-xl"></div>
         </div>
      </div>

      {/* --- KNIFE (Realistic) --- */}
      <div className="absolute bottom-[-10%] -right-[20%] w-60 z-10 drop-shadow-2xl transition-transform hover:rotate-2 duration-500">
        <svg viewBox="0 0 160 30" className="transform rotate-[-15deg] origin-center filter drop-shadow-lg">
          <defs>
            <linearGradient id="bladeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfcfcf" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#9e9e9e" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
            <linearGradient id="handleWood" x1="0" y1="0" x2="1" y2="0">
               <stop offset="0%" stopColor="#3E2723" />
               <stop offset="100%" stopColor="#5D4037" />
            </linearGradient>
          </defs>
          <path d="M50,12 Q120,5 150,12 L160,15 L150,18 Q120,25 50,18 Z" fill="url(#bladeGrad)" stroke="#757575" strokeWidth="0.5" />
          <path d="M10,10 L50,10 L50,20 L10,20 Q0,20 0,15 Q0,10 10,10 Z" fill="url(#handleWood)" stroke="#281915" strokeWidth="1"/>
          <circle cx="20" cy="15" r="2" fill="#D7CCC8"/>
          <circle cx="40" cy="15" r="2" fill="#D7CCC8"/>
        </svg>
      </div>

      {/* --- CAKE BASE CONTAINER --- */}
      {/* We shift this up slightly so it sits on the plate */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-[60%] w-[80%] h-[80%] z-10">
        
        {/* === BOTTOM TIER (Chocolate) === */}
        <div className="absolute top-0 left-0 w-full h-full z-10">
            {/* Side Walls (Simulated by stacking rounded layers or a thick border hack, but let's use the 'cylindrical' look via CSS stacking) */}
            <div className="absolute top-[15px] left-0 w-full h-full bg-[#3E2723] rounded-full shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-r from-[#281915] via-[#5D4037] to-[#281915] rounded-full"></div>
            </div>
            {/* Sponge Texture on Side */}
            <div className="absolute top-[15px] left-0 w-full h-full rounded-full sponge-texture opacity-30 mix-blend-overlay"></div>
            
            {/* Top Surface of Bottom Tier */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#4E342E] rounded-full border-b border-[#3E2723] shadow-inner"></div>
        </div>

        {/* === TOP TIER (Vanilla/Pink) === */}
        <div className="absolute top-[-15%] left-[10%] w-[80%] h-[80%] z-20">
            {/* Side Wall */}
            <div className="absolute top-[12px] left-0 w-full h-full bg-[#F8BBD0] rounded-full shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-r from-[#F48FB1] via-[#FCE4EC] to-[#F48FB1] rounded-full"></div>
            </div>
            
            {/* Drips Effect */}
            <div className="absolute top-[12px] -left-[2%] w-[104%] h-full pointer-events-none">
                 {/* CSS Radial gradient hack for drips could go here, but simple SVG is better or just CSS dots */}
                 <div className="w-full h-full rounded-full border-[4px] border-dashed border-white/50 opacity-30"></div>
            </div>

            {/* Top Surface (Lid) */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#FFF3E0] rounded-full border border-[#FFE0B2] shadow-inner flex items-center justify-center">
                {/* Frosting Ring */}
                <div className="absolute inset-0 rounded-full border-[10px] border-white/90 shadow-sm"></div>
                
                {/* Center Panda/Decoration */}
                <div className="absolute z-30 transform -translate-y-4">
                     <div className="relative w-12 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
                         {/* Panda Face */}
                         <div className="absolute -top-1 -left-1 w-4 h-4 bg-black rounded-full"></div>
                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full"></div>
                         <div className="flex gap-1 mt-1">
                             <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                             <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                         </div>
                     </div>
                </div>

                {/* TEXT: "My Babyyy" */}
                {/* Floating text in 3D space above the cake */}
                <div className="absolute z-40 transform translate-y-[-40px] translate-z-[50px] w-[200%] text-center pointer-events-none">
                    <span className="font-['Great_Vibes'] text-6xl text-[#D81B60] drop-shadow-[2px_2px_0px_#fff] block transform -rotate-6">
                        My Babyyy
                    </span>
                </div>

                {/* --- CHERRIES --- */}
                {cherries.map((c, i) => {
                     // 3D positioning
                     const zIndex = Math.floor(c.y + 100);
                     return (
                         <div key={`cherry-${i}`} className="absolute w-6 h-6 z-20"
                              style={{
                                  left: `calc(50% + ${c.x}%)`,
                                  top: `calc(50% + ${c.y}%)`,
                                  zIndex: zIndex,
                                  transform: 'translate(-50%, -50%)'
                              }}>
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-600 to-red-900 shadow-md">
                                  <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-40 blur-[1px]"></div>
                              </div>
                         </div>
                     );
                })}

                {/* --- CANDLES --- */}
                {candles.map((c, i) => {
                     const isExtinguished = i < candlesExtinguished;
                     // Z-index based on Y position (closer to viewer = higher z-index)
                     const zIndex = Math.floor(c.y + 150);

                     return (
                      <div key={`candle-${i}`} className="absolute" 
                           style={{
                                left: `calc(50% + ${c.x}%)`,
                                top: `calc(50% + ${c.y}%)`,
                                zIndex: zIndex,
                                transform: 'translate(-50%, -50%)'
                           }}>
                           {/* Wick */}
                           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-gray-800"></div>
                           
                           {/* Wax Body */}
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 rounded-sm shadow-md"
                                style={{
                                    height: `${c.height}px`,
                                    background: `linear-gradient(90deg, rgba(255,255,255,0.6), ${c.color}, rgba(0,0,0,0.1))`
                                }}>
                           </div>

                           {/* Flame */}
                           <div className={`absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-4 h-8 rounded-[50%_50%_20%_20%]
                                            bg-gradient-to-t from-blue-500 via-orange-500 to-yellow-200
                                            animate-flicker-real shadow-[0_0_20px_rgba(255,160,0,0.8)] mix-blend-screen
                                            transition-all duration-500 origin-bottom
                                            ${isExtinguished ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-blue-600 rounded-full blur-[1px] opacity-70"></div>
                           </div>

                           {/* Smoke Puff */}
                           {isExtinguished && (
                               <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-4 h-4 bg-gray-400 rounded-full blur-sm animate-smoke opacity-60"></div>
                           )}
                      </div>
                     );
                })}

            </div>
        </div>

      </div>
    </div>
  );
};
