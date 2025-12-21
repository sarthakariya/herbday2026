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
      height: 45 + Math.random() * 8, 
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

  // Sparkles
  const sparkles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2
  })), []);

  return (
    <div className="cake-assembly w-[320px] h-[320px] relative preserve-3d select-none">
      
      {/* --- PLATE --- */}
      <div className="absolute top-1/2 left-1/2 w-[130%] h-[130%] z-0" 
           style={{ transform: 'translate(-50%, -50%) translateZ(-5px)' }}>
         <div className="w-full h-full bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-gray-200 flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border-[6px] border-[#FFD700] opacity-80 shadow-inner"></div>
         </div>
      </div>

      {/* --- BASE TIER (Chocolate - Volumetric) --- */}
      <div className="absolute top-1/2 left-1/2 w-[90%] h-[90%] z-10 preserve-3d" 
           style={{ transform: 'translate(-50%, -50%)' }}>
           
           {/* Side Wall (The 2.5D trick: A rectangle with rounded bottom and gradient) */}
           <div className="absolute top-1/2 left-1/2 w-full h-[90px] rounded-[0_0_50%_50%/0_0_20px_20px]"
                style={{
                    transform: 'translate(-50%, -15px) rotateX(0deg)', // Push down to show "side"
                    background: 'linear-gradient(90deg, #3E2723, #5D4037 20%, #6D4C41 50%, #5D4037 80%, #3E2723)',
                    boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
                }}>
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] mix-blend-overlay"></div>
           </div>

           {/* Top Surface */}
           <div className="absolute top-0 left-0 w-full h-full rounded-full border border-[#3E2723]"
                style={{
                    background: 'radial-gradient(circle at 30% 30%, #5D4037, #3E2723)',
                    transform: 'translateZ(1px)', // Sits on top
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
           </div>
      </div>

      {/* --- TOP TIER (Vanilla/Pink - Volumetric) --- */}
      <div className="absolute top-1/2 left-1/2 w-[75%] h-[75%] z-20 preserve-3d"
           style={{ transform: 'translate(-50%, -50%) translateZ(40px)' }}>
           
           {/* Side Wall */}
           <div className="absolute top-1/2 left-1/2 w-full h-[80px] rounded-[0_0_50%_50%/0_0_25px_25px]"
                style={{
                    transform: 'translate(-50%, -20px)',
                    background: 'linear-gradient(90deg, #D81B60, #EC407A 20%, #F48FB1 50%, #EC407A 80%, #D81B60)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}>
           </div>

           {/* Top Surface */}
           <div className="absolute top-0 left-0 w-full h-full rounded-full border border-[#F8BBD0] flex items-center justify-center"
                style={{
                    background: 'radial-gradient(circle at 30% 30%, #FFF8E1, #FFECB3)',
                    transform: 'translateZ(1px)',
                    boxShadow: 'inset 0 0 15px rgba(255,200,100,0.2)'
                }}>
                
                {/* Sparkles */}
                {sparkles.map((s, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-sparkle" 
                         style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}></div>
                ))}

                {/* Frosting Rim */}
                <div className="absolute inset-[-5px] rounded-full border-[5px] border-dashed border-white opacity-90"></div>

                {/* --- PANDA --- */}
                <div className="absolute z-30 preserve-3d animate-bob" 
                     style={{ transform: 'rotateX(-20deg) translateY(-20px) translateZ(20px)' }}>
                     <div className="relative w-14 h-12 bg-gradient-to-b from-white to-gray-100 rounded-[45%_45%_40%_40%] shadow-lg border border-gray-200 flex items-center justify-center">
                         <div className="absolute -top-3 -left-2 w-5 h-5 bg-[#222] rounded-full -z-10 shadow-sm"></div>
                         <div className="absolute -top-3 -right-2 w-5 h-5 bg-[#222] rounded-full -z-10 shadow-sm"></div>
                         <div className="flex flex-col items-center mt-1">
                             <div className="flex gap-2">
                                 <div className="w-3.5 h-3.5 bg-[#222] rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full animate-blink"></div></div>
                                 <div className="w-3.5 h-3.5 bg-[#222] rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full animate-blink"></div></div>
                             </div>
                             <div className="w-2 h-1.5 bg-[#222] rounded-full mt-1"></div>
                             <div className="w-4 h-2 border-b-2 border-[#222] rounded-full"></div>
                         </div>
                         <div className="absolute top-6 left-1 w-2 h-1.5 bg-pink-200 rounded-full blur-[1px]"></div>
                         <div className="absolute top-6 right-1 w-2 h-1.5 bg-pink-200 rounded-full blur-[1px]"></div>
                     </div>
                </div>

                {/* --- TEXT --- */}
                <div className="absolute z-40 w-[200%] text-center pointer-events-none" 
                     style={{ transform: 'translateY(-55px) translateZ(30px) rotateX(-20deg)' }}>
                    <span className="font-['Great_Vibes'] text-5xl text-[#C2185B] drop-shadow-[1px_1px_0_#fff]">
                        My Babyyy
                    </span>
                </div>

                {/* --- CHERRIES --- */}
                {cherries.map((c, i) => {
                     const zIndex = 50 + Math.floor(c.y);
                     return (
                         <div key={`cherry-${i}`} className="absolute w-5 h-5 z-20 shadow-sm"
                              style={{
                                  left: `calc(50% + ${c.x}%)`,
                                  top: `calc(50% + ${c.y}%)`,
                                  zIndex: zIndex,
                                  transform: 'translate(-50%, -50%) rotateX(-30deg)'
                              }}>
                              <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_30%_30%,#ef5350,#b71c1c)] shadow-inner"></div>
                         </div>
                     );
                })}

                {/* --- CANDLES --- */}
                {candles.map((c, i) => {
                     const isExtinguished = i < candlesExtinguished;
                     const zIndex = 100 + Math.floor(c.y);

                     return (
                      <div key={`candle-${i}`} className="absolute preserve-3d" 
                           style={{
                                left: `calc(50% + ${c.x}%)`,
                                top: `calc(50% + ${c.y}%)`,
                                zIndex: zIndex,
                                transform: 'translate(-50%, 0) rotateX(-20deg)',
                                transformOrigin: 'bottom center'
                           }}>
                           
                           {/* Stick */}
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 rounded-sm shadow-[1px_1px_2px_rgba(0,0,0,0.3)]"
                                style={{
                                    height: `${c.height}px`,
                                    background: `linear-gradient(90deg, #fff, ${c.color}, #ddd)`
                                }}>
                           </div>

                           {/* Wick */}
                           <div className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-[1.5px] h-2 bg-[#333]"></div>

                           {/* Realistic 3D Flame */}
                           <div className={`flame-3d ${isExtinguished ? 'extinguished' : ''}`} style={{ bottom: `calc(100% + ${c.height + 2}px)` }}>
                                <div className="flame-core"></div>
                                <div className="flame-outer"></div>
                           </div>

                           {/* Realistic Smoke Puff */}
                           {isExtinguished && (
                               <div className="absolute bottom-full left-1/2 w-4 h-8 -translate-x-1/2 pointer-events-none">
                                   <div className="smoke-puff-particle"></div>
                               </div>
                           )}
                      </div>
                     );
                })}
            </div>
      </div>
    </div>
  );
};
