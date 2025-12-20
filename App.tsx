import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { BirthdayCake } from './components/BirthdayCake';
import { useBlowDetection } from './hooks/useBlowDetection';
import { Play, Mic, Heart } from 'lucide-react';

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
        // Romantic Chime
        const notes = [392.00, 493.88, 587.33, 783.99, 587.33, 493.88, 392.00]; 
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, t + i * 0.3);
            gain.gain.linearRampToValueAtTime(0.1, t + i * 0.3 + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.3 + 1.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + i * 0.3);
            osc.stop(t + i * 0.3 + 2);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2a0a12] flex flex-col font-['Montserrat'] selection:bg-pink-500 selection:text-white">
      
      {/* --- ROOM ATMOSPHERE --- */}
      <div className="spotlight"></div>
      
      {/* Floating Dust Particles/Hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {Array.from({length: 30}).map((_, i) => (
             <div key={i} className="absolute text-pink-300 opacity-20 animate-float-balloon"
                  style={{
                      left: `${Math.random() * 100}%`,
                      top: '100%',
                      animationDuration: `${10 + Math.random() * 10}s`,
                      animationDelay: `${Math.random() * 5}s`,
                      fontSize: `${Math.random() * 20 + 10}px`
                  }}>
                  {Math.random() > 0.5 ? '♥' : '•'}
             </div>
         ))}
      </div>

      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={300}
          colors={['#e91e63', '#ffc107', '#ffffff']}
          gravity={0.15}
        />
      )}

      {/* --- CURTAINS --- */}
      {hasStarted && (
        <>
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#4a0000] to-[#7f0000] z-50 shadow-[10px_0_50px_rgba(0,0,0,1)] ${curtainsOpen ? 'animate-curtain-left' : ''}`}>
                 <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.6)_50px,transparent_60px)]"></div>
            </div>
            <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#4a0000] to-[#7f0000] z-50 shadow-[-10px_0_50px_rgba(0,0,0,1)] ${curtainsOpen ? 'animate-curtain-right' : ''}`}>
                 <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.6)_50px,transparent_60px)]"></div>
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
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-[0_0_50px_rgba(233,30,99,0.6)] border-4 border-pink-900 hover:scale-105 transition-transform flex items-center gap-3"
             >
                <Heart fill="white" size={32} /> Open Surprise
             </button>
             <p className="text-pink-200 mt-6 font-medium tracking-[0.2em] uppercase text-sm opacity-80">For My Babyyy</p>
          </div>
        )}

        {/* Game Area */}
        {hasStarted && (
            <div className={`transition-opacity duration-1000 w-full h-full flex flex-col items-center justify-center ${curtainsOpen ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Header */}
                <div className="absolute top-[10%] z-30 text-center w-full pointer-events-none">
                    <h1 className="font-['Great_Vibes'] text-6xl md:text-8xl text-[#ffeb3b] drop-shadow-[0_0_20px_rgba(255,193,7,0.6)] animate-pulse">
                        {showCelebration ? "I Love You!" : "Make a Wish..."}
                    </h1>
                </div>

                {/* Mic Bar */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                    <Mic size={20} className={isListening ? "text-pink-400" : "text-gray-500"} />
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-75 shadow-[0_0_10px_#e91e63]"
                            style={{ width: `${Math.min(micLevel * 3, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Cake Container */}
                <div className="relative z-20 transform translate-y-[-20px]">
                     <BirthdayCake candlesExtinguished={candlesExtinguished} />
                </div>

                {/* WOODEN TABLE Surface */}
                <div className="absolute bottom-[-25vh] w-[150vw] h-[70vh] wood-texture rounded-[100%] z-10 transform rotate-x-12 shadow-[inset_0_20px_100px_rgba(0,0,0,0.9)] border-t-[8px] border-[#3e2723]">
                    {/* Table Reflection */}
                    <div className="absolute top-[10%] left-[20%] w-[60%] h-[20%] bg-white blur-[80px] opacity-10 rounded-[50%]"></div>
                </div>

                {/* Replay */}
                {showCelebration && (
                    <div className="absolute bottom-10 z-50">
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-white/90 backdrop-blur text-pink-700 px-10 py-4 rounded-full font-bold shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform"
                        >
                            Blow Again ❤️
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
