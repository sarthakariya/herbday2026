import React, { useMemo } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // Candles Distribution
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => {
    const angle = (i / 17) * Math.PI * 2;
    // Adjusted radius for the flatter 10deg perspective
    const radius = 38; 
    return {
      id: i,
      color: ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'][i % 4], 
      height: 40 + Math.random() * 8,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }), []);

  // Cherries Distribution
  const cherries = useMemo(() => Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 46;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }), []);

  return (
    // Cake Container
    <div className="cake-container mx-auto">
      
      {/* --- PLATE --- */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] z-0" style={{ transform: 'translate(-50%, -50%) translateZ(-10px)' }}>
         <div className="w-full h-full bg-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] border-[1px] border-gray-100 flex items-center justify-center">
            {/* Gold Rim */}
            <div className="absolute inset-0 rounded-full border-[6px] border-[#FFD700] opacity-80 shadow-sm"></div>
            {/* Inner Design */}
            <div className="w-[85%] h-[85%] rounded-full border border-gray-100 bg-gradient-to-tr from-gray-50 to-white"></div>
         </div>
      </div>

      {/* --- CAKE BASE (Chocolate) --- */}
      <div className="absolute top-[50%] left-1/2 w-[80%] h-[80%] z-10" 
           style={{ transform: 'translate(-50%, -50%) translateZ(0px)' }}>
        
        {/* Side Walls */}
        <div className="absolute top-0 left-0 w-full h-full z-10" style={{ transform: 'translateZ(-30px)' }}>
             <div className="absolute top-0 left-0 w-full h-full bg-[#3E2723] rounded-full shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-r from-[#281915] via-[#5D4037] to-[#281915] rounded-full"></div>
             </div>
             {/* Crumb Texture */}
             <div className="absolute inset-0 sponge-texture opacity-40 mix-blend-overlay rounded-full"></div>
             {/* Decoration on side */}
             <div className="absolute top-1/2 w-full h-[10px] bg-[#5d4037] opacity-50 blur-[1px]"></div>
        </div>

        {/* Top of Base */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#4E342E] rounded-full border border-[#3E2723] shadow-inner" style={{ transform: 'translateZ(0px)' }}></div>
      </div>

      {/* --- CAKE TOP (Pink/Vanilla) --- */}
      <div className="absolute top-[50%] left-1/2 w-[65%] h-[65%] z-20"
           style={{ transform: 'translate(-50%, -50%) translateZ(30px)' }}>
            
            {/* Side Wall */}
            <div className="absolute top-0 left-0 w-full h-full z-10" style={{ transform: 'translateZ(-30px)' }}>
                <div className="absolute inset-0 bg-[#F8BBD0] rounded-full shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F06292] via-[#FCE4EC] to-[#F06292] rounded-full"></div>
                </div>
                {/* Frosting Swirls on Side */}
                <div className="absolute inset-0 frosting-swirl rounded-full mix-blend-soft-light"></div>
            </div>

            {/* Top Surface */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#FFF3E0] rounded-full border border-[#FFE0B2] shadow-inner flex items-center justify-center"
                 style={{ transform: 'translateZ(0px)' }}>
                
                {/* Piped Edge (Using Border Trick) */}
                <div className="absolute inset-[-5px] rounded-full border-[8px] border-dashed border-[#FFF8E1] shadow-sm"></div>

                {/* --- ANIMATED PANDA --- */}
                <div className="absolute z-30 animate-bob" style={{ transform: 'rotateX(-10deg) translateY(-10px)' }}>
                     <div className="relative w-14 h-12 bg-white rounded-[45%_45%_40%_40%] shadow-md border border-gray-100 flex items-center justify-center">
                         {/* Ears */}
                         <div className="absolute -top-2 -left-1 w-5 h-5 bg-black rounded-full -z-10"></div>
                         <div className="absolute -top-2 -right-1 w-5 h-5 bg-black rounded-full -z-10"></div>
                         
                         {/* Face Container */}
                         <div className="flex flex-col items-center mt-2">
                             {/* Eyes */}
                             <div className="flex gap-2">
                                 <div className="w-3.5 h-3.5 bg-black rounded-full flex items-center justify-center overflow-hidden">
                                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-blink"></div>
                                 </div>
                                 <div className="w-3.5 h-3.5 bg-black rounded-full flex items-center justify-center overflow-hidden">
                                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-blink"></div>
                                 </div>
                             </div>
                             {/* Nose & Mouth */}
                             <div className="w-2 h-1.5 bg-black rounded-full mt-1"></div>
                             <div className="flex gap-[2px]">
                                <div className="w-2 h-2 border-b-2 border-black rounded-full"></div>
                                <div className="w-2 h-2 border-b-2 border-black rounded-full"></div>
                             </div>
                         </div>
                         
                         {/* Blush */}
                         <div className="absolute top-6 left-1 w-2 h-1 bg-pink-200 rounded-full blur-[1px]"></div>
                         <div className="absolute top-6 right-1 w-2 h-1 bg-pink-200 rounded-full blur-[1px]"></div>
                     </div>
                </div>

                {/* --- TEXT --- */}
                {/* Positioned slightly 'above' the cake surface using translateZ via parent context or absolute positioning hack */}
                <div className="absolute z-40 w-[200%] text-center pointer-events-none" style={{ transform: 'translateY(-45px) translateZ(10px) rotateX(-10deg)' }}>
                    <span className="font-['Great_Vibes'] text-5xl text-icing drop-shadow-md" data-text="My Babyyy">
                        My Babyyy
                    </span>
                </div>

                {/* --- CHERRIES --- */}
                {cherries.map((c, i) => {
                     const zIndex = Math.floor(c.y + 100);
                     return (
                         <div key={`cherry-${i}`} className="absolute w-5 h-5 z-20"
                              style={{
                                  left: `calc(50% + ${c.x}%)`,
                                  top: `calc(50% + ${c.y}%)`,
                                  zIndex: zIndex,
                                  transform: 'translate(-50%, -50%) rotateX(-10deg)' // Counter rotate slightly
                              }}>
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-900 shadow-sm">
                                  <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-white rounded-full opacity-40 blur-[0.5px]"></div>
                              </div>
                         </div>
                     );
                })}

                {/* --- CANDLES --- */}
                {candles.map((c, i) => {
                     const isExtinguished = i < candlesExtinguished;
                     const zIndex = Math.floor(c.y + 150);

                     return (
                      <div key={`candle-${i}`} className="absolute" 
                           style={{
                                left: `calc(50% + ${c.x}%)`,
                                top: `calc(50% + ${c.y}%)`,
                                zIndex: zIndex,
                                transform: 'translate(-50%, 0) rotateX(-10deg)', // Stand up straight from tilted surface
                                transformOrigin: 'bottom center'
                           }}>
                           
                           {/* Stick */}
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 rounded-sm shadow-sm"
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
                           <div className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-[2px] h-2 bg-gray-800"></div>

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
