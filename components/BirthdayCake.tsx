import React, { useMemo } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // Candles Distribution
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => {
    const angle = (i / 17) * Math.PI * 2;
    const radius = 38; 
    return {
      id: i,
      color: ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'][i % 4], 
      height: 50 + Math.random() * 10, // Made candles slightly taller
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }), []);

  // Cherries Distribution
  const cherries = useMemo(() => Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 48; // Slightly wider than candles
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }), []);

  return (
    // Cake Container - We assume the parent handles the main Scene rotation (X axis)
    // This component handles the local stacking (Z axis)
    <div className="cake-assembly w-[300px] h-[300px] relative preserve-3d">
      
      {/* --- PLATE --- */}
      {/* Moved down slightly to support the base */}
      <div className="absolute top-1/2 left-1/2 w-[140%] h-[140%] z-0" 
           style={{ transform: 'translate(-50%, -50%) translateZ(-10px)' }}>
         <div className="w-full h-full bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-gray-200 flex items-center justify-center">
            {/* Gold Rim */}
            <div className="absolute inset-0 rounded-full border-[8px] border-[#FFD700] opacity-90 shadow-sm"></div>
            {/* Inner Design */}
            <div className="w-[85%] h-[85%] rounded-full border border-gray-100 bg-gradient-to-tr from-gray-50 to-white"></div>
         </div>
      </div>

      {/* --- CAKE BASE (Chocolate) --- */}
      {/* Increased height for side view visibility */}
      <div className="absolute top-1/2 left-1/2 w-[85%] h-[85%] z-10 preserve-3d" 
           style={{ transform: 'translate(-50%, -50%) translateZ(0px)' }}>
        
        {/* Side Walls - Chocolate */}
        <div className="absolute inset-0 rounded-full bg-[#3E2723]" style={{ transform: 'translateZ(-40px)' }}></div>
        {/* We create a "cylinder" look by stacking slightly offset layers or using a thick border/shadow hack. 
            For CSS 3D, a true cylinder is hard, so we use a dark side layer + top layer. */}
        <div className="absolute inset-0 rounded-full bg-[#3E2723]" 
             style={{ 
               transform: 'translateZ(-40px)', 
               boxShadow: '0 20px 40px rgba(0,0,0,0.6)' // Shadow cast by the cake
             }}></div>
        
        {/* The "Side" visual - rendered as a pseudo-thickness using multiple shadows or a gradient container */}
        <div className="absolute top-0 left-0 w-full h-full rounded-full bg-[#4E342E]" 
             style={{ 
               transform: 'translateZ(-20px) scale(0.99)',
               boxShadow: '0 0 5px rgba(0,0,0,0.5)'
             }}></div>

        {/* Top of Base Layer */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#4E342E] rounded-full border-[2px] border-[#3E2723] shadow-inner" 
             style={{ transform: 'translateZ(0px)' }}>
             {/* Glossy Texture */}
             <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-30"></div>
        </div>
      </div>

      {/* --- CAKE TOP (Pink/Vanilla) --- */}
      <div className="absolute top-1/2 left-1/2 w-[70%] h-[70%] z-20 preserve-3d"
           style={{ transform: 'translate(-50%, -50%) translateZ(40px)' }}>
            
            {/* Side Wall Pink */}
            <div className="absolute inset-0 rounded-full bg-[#F06292] shadow-lg" 
                 style={{ transform: 'translateZ(-40px)' }}></div>
            
            {/* Top Surface */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#FFF3E0] rounded-full border border-[#FFE0B2] shadow-inner flex items-center justify-center"
                 style={{ transform: 'translateZ(0px)' }}>
                
                {/* Piped Edge */}
                <div className="absolute inset-[-5px] rounded-full border-[6px] border-dashed border-[#FFF8E1] shadow-sm"></div>

                {/* --- ANIMATED PANDA --- */}
                {/* Stood up vertically relative to the cake surface */}
                <div className="absolute z-30 animate-bob preserve-3d" 
                     style={{ transform: 'rotateX(-25deg) translateY(-15px) translateZ(10px)' }}>
                     <div className="relative w-16 h-14 bg-white rounded-[45%_45%_40%_40%] shadow-lg border border-gray-100 flex items-center justify-center">
                         {/* Ears */}
                         <div className="absolute -top-3 -left-2 w-6 h-6 bg-black rounded-full -z-10"></div>
                         <div className="absolute -top-3 -right-2 w-6 h-6 bg-black rounded-full -z-10"></div>
                         
                         {/* Face Container */}
                         <div className="flex flex-col items-center mt-2">
                             {/* Eyes */}
                             <div className="flex gap-2">
                                 <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center overflow-hidden">
                                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-blink"></div>
                                 </div>
                                 <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center overflow-hidden">
                                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-blink"></div>
                                 </div>
                             </div>
                             {/* Nose & Mouth */}
                             <div className="w-2.5 h-2 bg-black rounded-full mt-1"></div>
                             <div className="flex gap-[2px]">
                                <div className="w-2.5 h-2.5 border-b-[3px] border-black rounded-full"></div>
                                <div className="w-2.5 h-2.5 border-b-[3px] border-black rounded-full"></div>
                             </div>
                         </div>
                         
                         {/* Blush */}
                         <div className="absolute top-7 left-1 w-2.5 h-1.5 bg-pink-300 rounded-full blur-[2px]"></div>
                         <div className="absolute top-7 right-1 w-2.5 h-1.5 bg-pink-300 rounded-full blur-[2px]"></div>
                     </div>
                </div>

                {/* --- TEXT --- */}
                {/* Floating slightly above and tilted up to face camera */}
                <div className="absolute z-40 w-[200%] text-center pointer-events-none" 
                     style={{ transform: 'translateY(-50px) translateZ(25px) rotateX(-25deg)' }}>
                    <span className="font-['Great_Vibes'] text-6xl text-[#D81B60] drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]" style={{ textShadow: '2px 2px 0px white' }}>
                        My Babyyy
                    </span>
                </div>

                {/* --- CHERRIES --- */}
                {cherries.map((c, i) => {
                     const zIndex = 50 + Math.floor(c.y);
                     return (
                         <div key={`cherry-${i}`} className="absolute w-6 h-6 z-20"
                              style={{
                                  left: `calc(50% + ${c.x}%)`,
                                  top: `calc(50% + ${c.y}%)`,
                                  zIndex: zIndex,
                                  transform: 'translate(-50%, -50%) rotateX(-25deg)' // Counter rotate to look spherical
                              }}>
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-900 shadow-md">
                                  <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-white rounded-full opacity-40 blur-[0.5px]"></div>
                              </div>
                         </div>
                     );
                })}

                {/* --- CANDLES --- */}
                {candles.map((c, i) => {
                     const isExtinguished = i < candlesExtinguished;
                     // Order by Y so front candles overlap back ones
                     const zIndex = 100 + Math.floor(c.y);

                     return (
                      <div key={`candle-${i}`} className="absolute preserve-3d" 
                           style={{
                                left: `calc(50% + ${c.x}%)`,
                                top: `calc(50% + ${c.y}%)`,
                                zIndex: zIndex,
                                transform: 'translate(-50%, 0) rotateX(-25deg)', // Counter-rotate container to stand up vertically
                                transformOrigin: 'bottom center'
                           }}>
                           
                           {/* Stick */}
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 rounded-sm shadow-sm"
                                style={{
                                    height: `${c.height}px`,
                                    background: `linear-gradient(90deg, rgba(255,255,255,0.8), ${c.color}, rgba(0,0,0,0.1))`
                                }}>
                                {/* Stripes */}
                                <div className="absolute inset-0 w-full h-full opacity-30" 
                                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 7px)' }}>
                                </div>
                           </div>

                           {/* Wick */}
                           <div className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-gray-800"></div>

                           {/* 3D Flame */}
                           <div className={`flame-3d ${isExtinguished ? 'extinguished' : ''}`} style={{ bottom: `calc(100% + ${c.height}px)` }}>
                                <div className="flame-plane" style={{ '--ry': '0deg' } as React.CSSProperties}></div>
                                <div className="flame-plane" style={{ '--ry': '90deg' } as React.CSSProperties}></div>
                           </div>

                           {/* Smoke */}
                           {isExtinguished && (
                               <div className="smoke-puff" style={{ bottom: `calc(100% + ${c.height + 5}px)` }}></div>
                           )}
                      </div>
                     );
                })}
            </div>
      </div>
    </div>
  );
};
