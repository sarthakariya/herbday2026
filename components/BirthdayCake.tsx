import React, { useMemo } from 'react';

interface BirthdayCakeProps {
  candlesExtinguished: number;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({ candlesExtinguished }) => {
  // Generate 17 candles
  const candles = useMemo(() => Array.from({ length: 17 }), []);

  return (
    <div className="relative mt-20 transform scale-75 md:scale-100 transition-transform duration-500">
      {/* Cake Container */}
      <div className="flex flex-col items-center relative z-10">
        
        {/* Candles Container - Sitting on top */}
        <div className="absolute -top-12 flex justify-center items-end space-x-1 md:space-x-2 w-full px-4 flex-wrap z-20">
          {candles.map((_, index) => (
            <div key={index} className="relative group mx-0.5 md:mx-1 mb-1">
              {/* Flame */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-3 h-4 md:w-4 md:h-6 bg-yellow-400 rounded-full blur-[1px] animate-flicker origin-bottom transition-opacity duration-300 ${
                  index < candlesExtinguished ? 'opacity-0 scale-0' : 'opacity-100'
                }`}
                style={{
                  animationDelay: `${Math.random()}s`,
                  boxShadow: '0 0 10px #ffb700, 0 0 20px #ffb700'
                }}
              >
                 {/* Inner blue part of flame */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-blue-300 rounded-full opacity-50"></div>
              </div>
              
              {/* Wick */}
              <div className="w-[2px] h-2 bg-gray-800 mx-auto opacity-80"></div>
              
              {/* Candle Body */}
              <div 
                className="w-3 h-10 md:w-4 md:h-12 rounded-sm"
                style={{
                   backgroundColor: index % 2 === 0 ? '#FF69B4' : '#FFB6C1', // HotPink vs LightPink
                   boxShadow: 'inset -2px 0 2px rgba(0,0,0,0.1)'
                }}
              >
                  {/* Stripes */}
                  <div className="w-full h-2 bg-white/30 rotate-45 mt-2"></div>
                  <div className="w-full h-2 bg-white/30 rotate-45 mt-4"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Layer */}
        <div className="w-48 h-24 md:w-64 md:h-32 bg-pink-300 rounded-t-full rounded-b-lg relative shadow-lg z-10 border-b-4 border-pink-400">
            {/* Frosting Drips */}
            <div className="absolute top-0 w-full h-full overflow-hidden rounded-t-full">
                <div className="flex">
                    {Array.from({length: 8}).map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-white rounded-full -mt-4 shadow-sm"></div>
                    ))}
                </div>
            </div>
        </div>

        {/* Middle Layer */}
        <div className="w-64 h-24 md:w-80 md:h-32 bg-pink-400 rounded-lg relative -mt-4 shadow-md z-0 border-b-4 border-pink-500">
             <div className="absolute top-0 w-full flex justify-around">
                 <div className="w-full h-4 bg-white/20 rounded-full mt-4"></div>
             </div>
        </div>

        {/* Bottom Layer */}
        <div className="w-80 h-28 md:w-96 md:h-36 bg-pink-500 rounded-b-3xl rounded-t-lg relative -mt-4 shadow-xl -z-10 flex items-center justify-center">
             <div className="w-full h-full absolute top-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        </div>
        
        {/* Plate */}
        <div className="w-[22rem] h-4 md:w-[28rem] md:h-6 bg-gray-200 rounded-[100%] absolute bottom-[-10px] -z-20 shadow-2xl"></div>
      </div>
    </div>
  );
};