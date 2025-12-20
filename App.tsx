import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { BirthdayCake } from './components/BirthdayCake';
import { useBlowDetection } from './hooks/useBlowDetection';
import { Play, Mic } from 'lucide-react';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [candlesExtinguished, setCandlesExtinguished] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const TOTAL_CANDLES = 17;
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playWinMusic = () => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;
        const notes = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63]; 
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, t + i * 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.4 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + i * 0.4);
            osc.stop(t + i * 0.4 + 0.4);
        });
    } catch (e) { console.error(e); }
  };

  const handleBlow = () => {
    if (candlesExtinguished < TOTAL_CANDLES) {
      const amount = Math.floor(Math.random() * 2) + 1;
      setCandlesExtinguished(prev => Math.min(prev + amount, TOTAL_CANDLES));
    }
  };

  const { startListening, isListening, micLevel } = useBlowDetection(curtainsOpen, handleBlow);

  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
      playWinMusic();
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    setTimeout(() => {
        setCurtainsOpen(true);
        startListening();
    }, 100);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a0b1c] flex flex-col">
      
      {/* --- BACKGROUND DECOR --- */}
      <div className="spotlight"></div>
      
      {/* Bunting Streamers */}
      <div className="absolute top-0 w-full h-24 flex justify-between px-2 z-0 opacity-90 pointer-events-none">
         {Array.from({ length: 15 }).map((_, i) => (
             <div 
               key={i} 
               className="w-8 h-10 origin-top animate-pulse"
               style={{ 
                  backgroundColor: ['#ef5350', '#42a5f5', '#ffca28', '#66bb6a'][i%4],
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  animationDelay: `${i*0.2}s`,
                  transform: `scale(${0.8 + Math.random()*0.4})`
               }}
             ></div>
         ))}
      </div>

      {/* Floating Balloons */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {[
              { color: 'bg-red-500', left: '10%', delay: '0s' },
              { color: 'bg-blue-400', left: '85%', delay: '2s' },
              { color: 'bg-yellow-400', left: '25%', delay: '4s' },
              { color: 'bg-green-400', left: '70%', delay: '1s' },
              { color: 'bg-purple-400', left: '50%', delay: '3s' },
          ].map((b, i) => (
              <div 
                key={i}
                className={`absolute -bottom-20 w-20 h-24 ${b.color} rounded-[50%] opacity-70 animate-float-balloon shadow-lg`}
                style={{ left: b.left, animationDelay: b.delay }}
              >
                  <div className="absolute bottom-[-10px] left-1/2 w-0.5 h-10 bg-gray-400 opacity-50"></div>
              </div>
          ))}
      </div>

      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          gravity={0.2}
          recycle={false}
        />
      )}

      {/* --- CURTAINS --- */}
      {hasStarted && (
        <>
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#5a0000] to-[#800000] z-50 shadow-[10px_0_50px_rgba(0,0,0,1)] ${curtainsOpen ? 'animate-curtain-left' : ''}`}>
                 {/* Folds */}
                 <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.5)_50px,transparent_60px)]"></div>
            </div>
            <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#5a0000] to-[#800000] z-50 shadow-[-10px_0_50px_rgba(0,0,0,1)] ${curtainsOpen ? 'animate-curtain-right' : ''}`}>
                 <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.5)_50px,transparent_60px)]"></div>
            </div>
        </>
      )}

      {/* --- MAIN STAGE --- */}
      <div className="flex-grow relative z-40 flex flex-col items-center justify-center">
        
        {/* Start Button */}
        {!hasStarted && (
          <div className="z-50 text-center animate-bounce">
             <button 
                onClick={handleStart}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-[0_0_40px_rgba(236,72,153,0.8)] border-2 border-pink-300 hover:scale-110 transition-transform flex items-center gap-3"
             >
                <Play fill="white" size={32} /> Open Surprise
             </button>
             <p className="text-pink-200 mt-4 font-medium tracking-wide">Enable Microphone & Sound 🔊</p>
          </div>
        )}

        {/* Game Area */}
        {hasStarted && (
            <div className={`transition-opacity duration-1000 w-full h-full flex flex-col items-center ${curtainsOpen ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Header */}
                <div className="absolute top-16 z-30 text-center w-full">
                    <h1 className="font-['Great_Vibes'] text-6xl md:text-8xl text-[#FFD700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse">
                        {showCelebration ? "Happy Birthday!" : "Make a Wish!"}
                    </h1>
                </div>

                {/* Mic Bar */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/60 px-5 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                    <Mic size={24} className={isListening ? "text-green-400" : "text-gray-400"} />
                    <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75"
                            style={{ width: `${Math.min(micLevel * 3, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Cake */}
                <div className="relative z-20">
                     <BirthdayCake candlesExtinguished={candlesExtinguished} />
                </div>

                {/* TABLE Surface */}
                <div className="absolute bottom-[-20vh] w-[140vw] h-[60vh] wood-texture rounded-[50%] z-10 transform rotate-x-12 shadow-[inset_0_20px_50px_rgba(0,0,0,0.8)] border-t-4 border-[#5d4037]"></div>

                {/* Replay */}
                {showCelebration && (
                    <div className="absolute bottom-20 z-50">
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-white text-pink-600 px-8 py-3 rounded-full font-bold shadow-2xl hover:bg-gray-100 transform hover:-translate-y-1 transition-all"
                        >
                            Blow Again
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default App;